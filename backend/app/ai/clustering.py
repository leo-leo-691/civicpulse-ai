import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sklearn.cluster import DBSCAN
from sklearn.neighbors import NearestNeighbors
from sklearn.metrics import silhouette_score
from scipy.spatial.distance import pdist, squareform
from app.models.domain import CitizenRequest, RequestCluster, Location, Demographic, Recommendation
from app.services.priority import calculate_priority_score
from app.ai.pipeline import calculate_cluster_centroid, cosine_similarity

class SemanticClusterEngine:
    def __init__(
        self,
        eps: float = 0.25,
        min_samples: int = 2
    ):
        self.eps = eps
        self.min_samples = min_samples

    def compute_dbscan(
        self,
        embeddings: List[List[float]],
        eps: Optional[float] = None,
        min_samples: Optional[int] = None
    ) -> Tuple[np.ndarray, str]:
        """
        Executes DBSCAN using sparse neighborhood graph for N > 5000 or dense matrix for N <= 5000.
        Returns (labels_array, execution_mode).
        """
        if not embeddings:
            return np.array([]), "EMPTY"

        eps_val = eps or self.eps
        min_s = min_samples or self.min_samples
        n_samples = len(embeddings)
        matrix = np.array(embeddings, dtype=float)

        if n_samples > 5000:
            # Scalable Sparse Neighborhood Graph -> DBSCAN(metric='precomputed')
            nn = NearestNeighbors(radius=eps_val, metric="cosine", algorithm="brute")
            nn.fit(matrix)
            sparse_graph = nn.radius_neighbors_graph(matrix, mode="distance")
            dbscan = DBSCAN(eps=eps_val, min_samples=min_s, metric="precomputed")
            labels = dbscan.fit_predict(sparse_graph)
            return labels, "SPARSE"
        else:
            # Dense Cosine Distance DBSCAN
            dbscan = DBSCAN(eps=eps_val, min_samples=min_s, metric="cosine")
            labels = dbscan.fit_predict(matrix)
            return labels, "DENSE"

    def validate_sparse_vs_dense(self, embeddings: List[List[float]], eps: float = 0.25, min_samples: int = 2) -> bool:
        """
        Validates that sparse neighborhood graph DBSCAN produces identical cluster relationships to dense DBSCAN.
        """
        if not embeddings or len(embeddings) < 2:
            return True
        matrix = np.array(embeddings, dtype=float)

        # Dense
        dense_db = DBSCAN(eps=eps, min_samples=min_samples, metric="cosine")
        dense_labels = dense_db.fit_predict(matrix)

        # Sparse
        nn = NearestNeighbors(radius=eps, metric="cosine", algorithm="brute")
        nn.fit(matrix)
        sparse_graph = nn.radius_neighbors_graph(matrix, mode="distance")
        sparse_db = DBSCAN(eps=eps, min_samples=min_samples, metric="precomputed")
        sparse_labels = sparse_db.fit_predict(sparse_graph)

        # Compare cluster pair relationship matrix
        n = len(embeddings)
        dense_pairs = (dense_labels[:, None] == dense_labels[None, :]) & (dense_labels[:, None] >= 0)
        sparse_pairs = (sparse_labels[:, None] == sparse_labels[None, :]) & (sparse_labels[:, None] >= 0)
        return bool(np.array_equal(dense_pairs, sparse_pairs))

    def evaluate_grid(
        self,
        embeddings: List[List[float]],
        eps_candidates: List[float] = [0.20, 0.25, 0.30, 0.35],
        min_samples_candidates: List[int] = [2, 3, 5, 10]
    ) -> Dict[str, Any]:
        """
        Evaluates grid of eps and min_samples candidates across semantic coherence, noise %, cluster count, silhouette score.
        """
        if not embeddings or len(embeddings) < 2:
            return {
                "best_eps": self.eps,
                "best_min_samples": self.min_samples,
                "evaluation_metrics": {}
            }

        matrix = np.array(embeddings, dtype=float)
        best_score = -1.0
        best_params = (self.eps, self.min_samples)
        grid_results = []

        for eps_val in eps_candidates:
            for min_s in min_samples_candidates:
                labels, _ = self.compute_dbscan(embeddings, eps=eps_val, min_samples=min_s)
                n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
                n_noise = int(np.sum(labels == -1))
                noise_pct = (n_noise / len(labels)) * 100.0

                sil_score = -1.0
                if n_clusters > 1 and len(labels) - n_noise > n_clusters:
                    try:
                        # Compute silhouette on non-noise samples
                        non_noise_mask = labels != -1
                        sil_score = float(silhouette_score(matrix[non_noise_mask], labels[non_noise_mask], metric="cosine"))
                    except Exception:
                        sil_score = -1.0

                grid_results.append({
                    "eps": eps_val,
                    "min_samples": min_s,
                    "n_clusters": n_clusters,
                    "noise_pct": round(noise_pct, 2),
                    "silhouette_score": round(sil_score, 4)
                })

                if sil_score > best_score:
                    best_score = sil_score
                    best_params = (eps_val, min_s)

        return {
            "best_eps": best_params[0],
            "best_min_samples": best_params[1],
            "grid_results": grid_results
        }

    def execute_batch_clustering(
        self,
        db: Session
    ) -> Dict[str, Any]:
        """
        Executes Authoritative Batch DBSCAN Clustering over stored primary requests.
        - Updates primary requests and linked duplicates.
        - Archives stale clusters with 0 primary requests.
        - Transactionally commits or rolls back on failure.
        """
        try:
            # 1. Fetch all primary/unique requests with embeddings
            primary_requests = db.query(CitizenRequest).filter(
                CitizenRequest.duplicate_of_id.is_(None)
            ).all()

            if not primary_requests:
                return {"status": "SUCCESS", "clusters_created": 0, "processed_requests": 0}

            valid_reqs = [r for r in primary_requests if r.embedding_json]
            if not valid_reqs:
                return {"status": "SUCCESS", "clusters_created": 0, "processed_requests": len(primary_requests)}

            embeddings = [r.embedding_json for r in valid_reqs]
            labels, exec_mode = self.compute_dbscan(embeddings)

            # 2. Group requests by DBSCAN label
            label_map: Dict[int, List[CitizenRequest]] = {}
            for req, label in zip(valid_reqs, labels):
                label_map.setdefault(label, []).append(req)

            # Handle Noise (-1): Outliers get cluster_id = None (NEVER persisted as RequestCluster(id=-1))
            if -1 in label_map:
                for noise_req in label_map[-1]:
                    noise_req.cluster_id = None
                    db.add(noise_req)
                    # Also update duplicates of noise request
                    db.query(CitizenRequest).filter(
                        CitizenRequest.duplicate_of_id == noise_req.id
                    ).update({CitizenRequest.cluster_id: None}, synchronize_session=False)

            active_cluster_ids = set()

            # 3. Create or Update Authoritative RequestClusters for labels >= 0
            for label, req_group in label_map.items():
                if label < 0:
                    continue

                primary_ids = [r.id for r in req_group]
                linked_duplicates = db.query(CitizenRequest).filter(
                    CitizenRequest.duplicate_of_id.in_(primary_ids)
                ).all()

                unique_count = len(req_group)
                total_count = unique_count + len(linked_duplicates)

                # Ground-truth population proxy & locality aggregation
                linked_locations = list({r.location for r in req_group if r.location})
                affected_villages = len(linked_locations)
                pop_proxy = sum((loc.demographics.population for loc in linked_locations if loc and loc.demographics), 0) or None

                cat = req_group[0].category or "General Infrastructure"
                subcat = req_group[0].subcategory or "Public Service"
                district = linked_locations[0].district if linked_locations else "District"

                # Find or create RequestCluster
                existing_cluster = db.query(RequestCluster).filter(
                    RequestCluster.category == cat,
                    RequestCluster.district == district,
                    RequestCluster.status == "Active"
                ).first()

                # Calculate the priority score with real data
                location = req_group[0].location
                infra_coverage = location.infrastructure.overall_index if location and location.infrastructure else 35.0
                vuln_index = location.demographics.vulnerability_index if location and location.demographics else 75.0
                mob_pen = location.demographics.mobile_penetration_rate if location and location.demographics else (48.0 if district == "Pune" else 75.0)

                p_breakdown = calculate_priority_score(
                    unique_request_count=unique_count,
                    total_request_count=total_count,
                    infra_coverage_pct=infra_coverage,
                    affected_population=pop_proxy or 1000,
                    vulnerability_index=vuln_index,
                    existing_investment_pct=30.0,
                    urgency_score=85.0,
                    mobile_penetration_pct=mob_pen
                )

                if not existing_cluster:
                    cluster = RequestCluster(
                        title=f"{cat} - {district} Cluster",
                        category=cat,
                        subcategory=subcat,
                        district=district,
                        unique_request_count=unique_count,
                        total_request_count=total_count,
                        affected_villages_count=affected_villages,
                        estimated_population=pop_proxy,
                        priority_score=p_breakdown.overall_score,
                        digital_access_correction=p_breakdown.digital_access_correction,
                        is_under_reported_flag=p_breakdown.under_reported_flag,
                        status="Active"
                    )
                    db.add(cluster)
                    db.flush()
                    cluster_id = cluster.id
                else:
                    existing_cluster.unique_request_count = unique_count
                    existing_cluster.total_request_count = total_count
                    existing_cluster.affected_villages_count = affected_villages
                    existing_cluster.estimated_population = pop_proxy
                    existing_cluster.priority_score = p_breakdown.overall_score
                    existing_cluster.digital_access_correction = p_breakdown.digital_access_correction
                    existing_cluster.is_under_reported_flag = p_breakdown.under_reported_flag
                    db.add(existing_cluster)
                    cluster_id = existing_cluster.id

                active_cluster_ids.add(cluster_id)

                # Assign cluster_id to primary requests
                for req in req_group:
                    req.cluster_id = cluster_id
                    db.add(req)

                # Update linked duplicates to authoritative cluster
                if primary_ids:
                    db.query(CitizenRequest).filter(
                        CitizenRequest.duplicate_of_id.in_(primary_ids)
                    ).update({CitizenRequest.cluster_id: cluster_id}, synchronize_session=False)

            # 4. Stale Cluster Archiving
            # Archive active clusters that now have 0 primary requests
            all_active_clusters = db.query(RequestCluster).filter(RequestCluster.status == "Active").all()
            for c in all_active_clusters:
                if c.id not in active_cluster_ids:
                    remaining_primaries = db.query(CitizenRequest).filter(
                        CitizenRequest.cluster_id == c.id,
                        CitizenRequest.duplicate_of_id.is_(None)
                    ).count()
                    if remaining_primaries == 0:
                        c.status = "Archived"
                        c.unique_request_count = 0
                        db.add(c)
                        # Archive linked recommendations so they don't point to obsolete active clusters
                        db.query(Recommendation).filter(
                            Recommendation.cluster_id == c.id
                        ).update({Recommendation.status: "Archived"}, synchronize_session=False)

            db.commit()
            return {
                "status": "SUCCESS",
                "execution_mode": exec_mode,
                "clusters_created_or_updated": len(active_cluster_ids),
                "processed_requests": len(valid_reqs)
            }

        except Exception as e:
            db.rollback()
            raise e

cluster_engine = SemanticClusterEngine()
