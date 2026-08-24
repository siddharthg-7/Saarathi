from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.models import (
    RiskPredictionRequest,
    RiskPredictionResponse,
    BatchRiskPredictionResponse,
    EnergyClusterModel,
    OptimalTimeSlotModel,
    EnergyClusterResponse,
    BurnoutDetectionResponse,
    DailyForecastModel,
    ProductivityForecastResponse,
    TaskClusterItemModel,
    TaskClusterModel,
    TaskSemanticClusterResponse,
)

COLD_START_THRESHOLD = 50

class MLService:
    @staticmethod
    def _is_cold_start(events_count: Optional[int] = None, data_points: int = 0) -> bool:
        if events_count is not None and events_count >= COLD_START_THRESHOLD:
            return False
        return data_points < COLD_START_THRESHOLD

    # ==========================================
    # 1. TASK RISK & COMPLETION PREDICTION
    # ==========================================
    @classmethod
    def predict_single_task_risk(
        cls,
        task: RiskPredictionRequest,
        user_id: Optional[str] = None,
        events_count: Optional[int] = None,
        historical_features: Optional[List[Dict[str, Any]]] = None,
    ) -> RiskPredictionResponse:
        contributing_factors: List[str] = []
        is_cold = cls._is_cold_start(events_count, len(historical_features or []))

        # 1. Base factors
        postpone_count = max(0, task.postponeCount)
        energy = (task.energyRequired or "Medium").capitalize()
        priority = (task.priority or "Medium").capitalize()
        duration = task.estimatedDuration or 30

        # Heuristic calculations
        base_skip = 10.0 + (postpone_count * 22.0)
        base_delay = 15.0 + (postpone_count * 18.0)

        if postpone_count > 0:
            contributing_factors.append(f"Task has been postponed {postpone_count} time(s)")

        if priority == "Urgent":
            base_delay += 10.0
            contributing_factors.append("High urgency pressure increases delay risk under workload")
        elif priority == "High":
            base_delay += 5.0

        if energy == "High":
            base_skip += 8.0
            base_delay += 7.0
            contributing_factors.append("High mental energy requirement")

        if duration > 90:
            base_delay += 12.0
            base_skip += 10.0
            contributing_factors.append(f"Long duration ({duration}m) without subtask division")

        # Check deadline urgency if available
        if task.deadline:
            try:
                deadline_dt = datetime.fromisoformat(task.deadline.replace("Z", "+00:00"))
                now_dt = datetime.now(deadline_dt.tzinfo) if deadline_dt.tzinfo else datetime.now(timezone.utc)
                hours_left = (deadline_dt - now_dt).total_seconds() / 3600.0
                if hours_left < 0:
                    base_skip += 20.0
                    base_delay += 25.0
                    contributing_factors.append("Task is currently past its deadline")
                elif hours_left < 12:
                    base_delay += 8.0
                    contributing_factors.append(f"Imminent deadline ({int(hours_left)}h remaining)")
            except Exception:
                pass

        # 2. ML Enhancement if not cold start and historical data is sufficient
        if not is_cold and historical_features and len(historical_features) >= 10:
            try:
                X = []
                y = []
                for f in historical_features:
                    dur = f.get("estimatedDuration", 30)
                    p_cnt = f.get("rescheduleCount", 0)
                    dow = f.get("dayOfWeek", 1)
                    hod = f.get("hourOfDay", 9)
                    prior_num = 3 if f.get("priority") == "Urgent" else (2 if f.get("priority") == "High" else 1)
                    energy_num = 3 if f.get("energyLevel") == "High" else (2 if f.get("energyLevel") == "Medium" else 1)
                    X.append([dur, p_cnt, dow, hod, prior_num, energy_num])
                    # Target: 1 if skipped/postponed, 0 if on time
                    outcome = f.get("outcomeTarget", "completed_on_time")
                    y.append(1 if outcome in ("skipped", "postponed", "completed_late") else 0)

                if len(set(y)) > 1:
                    clf = RandomForestClassifier(n_estimators=20, max_depth=4, random_state=42)
                    clf.fit(X, y)
                    now = datetime.now(timezone.utc)
                    cur_prior = 3 if priority == "Urgent" else (2 if priority == "High" else 1)
                    cur_energy = 3 if energy == "High" else (2 if energy == "Medium" else 1)
                    sample = np.array([[duration, postpone_count, now.weekday(), now.hour, cur_prior, cur_energy]])
                    proba = clf.predict_proba(sample)[0]
                    # Blend ML prediction with heuristic
                    ml_risk_pct = float(proba[1] * 100.0)
                    base_delay = 0.6 * base_delay + 0.4 * ml_risk_pct
                    base_skip = 0.6 * base_skip + 0.4 * (ml_risk_pct * 0.9)
            except Exception:
                pass

        skip_prob = float(np.clip(round(base_skip, 1), 5.0, 95.0))
        delay_prob = float(np.clip(round(base_delay, 1), 5.0, 95.0))
        completion_prob = float(np.clip(round(100.0 - (delay_prob * 0.6 + skip_prob * 0.4), 1), 5.0, 95.0))

        # Risk level determination
        max_prob = max(skip_prob, delay_prob)
        if max_prob >= 75.0 or postpone_count >= 3:
            risk_level = "critical"
            high_risk = True
        elif max_prob >= 50.0 or postpone_count >= 1:
            risk_level = "high"
            high_risk = True
        elif max_prob >= 30.0:
            risk_level = "medium"
            high_risk = False
        else:
            risk_level = "low"
            high_risk = False

        # Recommended Action
        if risk_level in ("high", "critical"):
            if duration > 45:
                recommended_action = "Break into 25-minute subtasks and schedule for morning peak focus window"
            elif postpone_count >= 2:
                recommended_action = "Re-evaluate priority or delegate/simplify requirements"
            else:
                recommended_action = "Block immediate 20-minute focus session with Kairo"
        elif risk_level == "medium":
            recommended_action = "Schedule during optimal energy window today"
        else:
            recommended_action = "On track for timely completion"

        if not contributing_factors:
            contributing_factors.append("Standard workload and clear priority assignment")

        return RiskPredictionResponse(
            taskId=task.id,
            skipProbability=skip_prob,
            delayProbability=delay_prob,
            completionProbability=completion_prob,
            highRisk=high_risk,
            riskLevel=risk_level,
            contributingFactors=contributing_factors,
            recommendedAction=recommended_action,
            isColdStart=is_cold,
        )

    @classmethod
    def predict_batch_risk(
        cls,
        tasks: List[RiskPredictionRequest],
        user_id: Optional[str] = None,
        events_count: Optional[int] = None,
    ) -> BatchRiskPredictionResponse:
        predictions: List[RiskPredictionResponse] = []
        high_risk_count = 0
        is_cold = cls._is_cold_start(events_count, len(tasks))

        for task in tasks:
            pred = cls.predict_single_task_risk(task, user_id=user_id, events_count=events_count)
            predictions.append(pred)
            if pred.highRisk:
                high_risk_count += 1

        return BatchRiskPredictionResponse(
            predictions=predictions,
            highRiskCount=high_risk_count,
            isColdStart=is_cold,
        )

    # ==========================================
    # 2. ENERGY & FOCUS CLUSTERING (K-MEANS)
    # ==========================================
    @classmethod
    def cluster_energy_windows(
        cls,
        user_id: str,
        hourly_stats: Optional[List[Dict[str, Any]]] = None,
        events: Optional[List[Dict[str, Any]]] = None,
    ) -> EnergyClusterResponse:
        is_cold = False
        hours = list(range(24))

        # Default heuristic distribution (if cold start)
        # Hour -> [productivityScore, focusMinutes, completionRate]
        data_matrix = []
        if not hourly_stats or len(hourly_stats) < 12:
            is_cold = True
            # Cold-start heuristic pattern: Peak 9-12 & 15-18, Low 0-6 & 13-14 & 21-23
            for h in hours:
                if 9 <= h <= 12:
                    score = 85 + (h % 3) * 5
                    focus = 40 + (h % 3) * 5
                    comp = 80
                elif 14 <= h <= 18:
                    score = 75 + (h % 2) * 5
                    focus = 35 + (h % 2) * 5
                    comp = 75
                elif 19 <= h <= 22:
                    score = 55
                    focus = 20
                    comp = 60
                else:
                    score = 20
                    focus = 5
                    comp = 30
                data_matrix.append([score, focus, comp])
        else:
            for h in hours:
                stat = next((s for s in hourly_stats if s.get("hour") == h), None)
                if stat:
                    data_matrix.append([
                        float(stat.get("productivityScore", 50)),
                        float(stat.get("focusMinutes", 20)),
                        float(stat.get("completionRate", 60)),
                    ])
                else:
                    data_matrix.append([30.0, 10.0, 40.0])

        X = np.array(data_matrix)

        # Run K-Means with 3 clusters
        try:
            kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
            labels = kmeans.fit_predict(X)
            centers = kmeans.cluster_centers_

            # Sort clusters by center productivity score
            # Highest center -> Peak Deep Work, Middle -> Moderate Execution, Lowest -> Low Energy
            cluster_order = np.argsort(-centers[:, 0])
            cluster_map = {cluster_order[0]: ("Peak Deep Work", "High"),
                           cluster_order[1]: ("Afternoon & Execution Focus", "Medium"),
                           cluster_order[2]: ("Low Energy & Administrative", "Low")}

            clusters: List[EnergyClusterModel] = []
            for rank, old_idx in enumerate(cluster_order):
                c_name, energy_fit = cluster_map[old_idx]
                c_hours = [int(h) for h in range(24) if labels[h] == old_idx]
                avg_score = float(round(centers[old_idx][0], 1))
                avg_focus = float(round(centers[old_idx][1], 1))
                clusters.append(
                    EnergyClusterModel(
                        clusterId=rank + 1,
                        name=c_name,
                        hours=c_hours,
                        averageProductivityScore=avg_score,
                        averageFocusMinutes=avg_focus,
                        recommendedEnergyType=energy_fit,
                    )
                )
        except Exception:
            is_cold = True
            clusters = [
                EnergyClusterModel(
                    clusterId=1,
                    name="Peak Deep Work",
                    hours=[9, 10, 11, 12],
                    averageProductivityScore=88.0,
                    averageFocusMinutes=45.0,
                    recommendedEnergyType="High",
                ),
                EnergyClusterModel(
                    clusterId=2,
                    name="Afternoon & Execution Focus",
                    hours=[14, 15, 16, 17, 18],
                    averageProductivityScore=72.0,
                    averageFocusMinutes=32.0,
                    recommendedEnergyType="Medium",
                ),
                EnergyClusterModel(
                    clusterId=3,
                    name="Low Energy & Administrative",
                    hours=[0, 1, 2, 3, 4, 5, 6, 7, 8, 13, 19, 20, 21, 22, 23],
                    averageProductivityScore=35.0,
                    averageFocusMinutes=12.0,
                    recommendedEnergyType="Low",
                ),
            ]

        # Find dominant peak hour
        dominant_peak_hour = int(np.argmax(X[:, 0]))

        # Generate optimal time slots for the week
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        optimal_slots: List[OptimalTimeSlotModel] = []
        for d_idx, d_name in enumerate(day_names):
            if d_idx < 5:  # Weekdays
                optimal_slots.append(
                    OptimalTimeSlotModel(
                        dayOfWeek=d_idx + 1,
                        dayName=d_name,
                        startHour=9,
                        endHour=12,
                        label="Morning Peak Deep Focus",
                        energyFit="high",
                        averageProductivityScore=88,
                    )
                )
                optimal_slots.append(
                    OptimalTimeSlotModel(
                        dayOfWeek=d_idx + 1,
                        dayName=d_name,
                        startHour=14,
                        endHour=17,
                        label="Afternoon Task Execution",
                        energyFit="medium",
                        averageProductivityScore=74,
                    )
                )
            else:  # Weekends
                optimal_slots.append(
                    OptimalTimeSlotModel(
                        dayOfWeek=d_idx + 1,
                        dayName=d_name,
                        startHour=10,
                        endHour=13,
                        label="Weekend Creative Flow",
                        energyFit="medium",
                        averageProductivityScore=70,
                    )
                )

        return EnergyClusterResponse(
            userId=user_id,
            clusters=clusters,
            optimalTimeSlots=optimal_slots,
            dominantPeakHour=dominant_peak_hour if dominant_peak_hour > 0 else 10,
            isColdStart=is_cold,
        )

    # ==========================================
    # 3. BURNOUT & WORKLOAD ANOMALY DETECTION (ISOLATION FOREST)
    # ==========================================
    @classmethod
    def detect_burnout_and_anomalies(
        cls,
        user_id: str,
        recent_daily_stats: Optional[List[Dict[str, Any]]] = None,
        recent_tasks: Optional[List[Dict[str, Any]]] = None,
        recent_events: Optional[List[Dict[str, Any]]] = None,
    ) -> BurnoutDetectionResponse:
        contributing_indicators: List[str] = []
        recommendations: List[str] = []
        is_cold = False

        if not recent_daily_stats or len(recent_daily_stats) < 7:
            is_cold = True
            # Cold-start fallback calculation
            stats = recent_daily_stats or []
            total_focus = sum(s.get("focusMinutes", 0) for s in stats)
            total_overdue = sum(s.get("tasksOverdue", 0) for s in stats)
            reschedule_count = sum(s.get("tasksRescheduled", 0) for s in stats)

            risk_score = 25.0
            if total_focus > 300:
                risk_score += 15.0
            if total_overdue > 5:
                risk_score += 20.0
                contributing_indicators.append(f"Elevated overdue tasks ({total_overdue} accumulated)")
            if reschedule_count > 4:
                risk_score += 15.0
                contributing_indicators.append(f"Frequent task rescheduling ({reschedule_count} times)")

            risk_score = min(100.0, max(10.0, risk_score))
            risk_level = "high" if risk_score >= 70.0 else ("moderate" if risk_score >= 40.0 else "low")

            if risk_level == "low":
                contributing_indicators.append("Balanced task load and healthy focus sessions")
                recommendations.append("Maintain consistent pace and regular 5-minute Pomodoro breaks")
            elif risk_level == "moderate":
                recommendations.append("Consider capping daily focus duration to 4 hours")
                recommendations.append("Clear overdue backlog before taking on new projects")
            else:
                recommendations.append("Schedule a rest block and defer non-critical urgent tasks")

            return BurnoutDetectionResponse(
                userId=user_id,
                burnoutRiskScore=risk_score,
                anomalyDetected=risk_score >= 60.0,
                riskLevel=risk_level,
                contributingIndicators=contributing_indicators,
                workloadTrend="stable",
                recommendations=recommendations,
                isColdStart=True,
            )

        # ML Isolation Forest Pipeline on daily rolling metrics
        # Features per day: [focusMinutes, completionRate, overdueRatio, rescheduleRate, interruptionCount]
        X = []
        focus_vals = []
        overdue_vals = []
        reschedule_vals = []

        for s in recent_daily_stats:
            f_min = float(s.get("focusMinutes", 0))
            t_planned = max(1, s.get("tasksPlanned", 1))
            t_comp = s.get("tasksCompleted", 0)
            t_overdue = s.get("tasksOverdue", 0)
            t_resched = s.get("tasksRescheduled", 0)
            interrupts = float(s.get("interruptionCount", 0))

            comp_rate = (t_comp / t_planned) * 100.0
            overdue_ratio = (t_overdue / t_planned) * 100.0
            resched_rate = (t_resched / t_planned) * 100.0

            focus_vals.append(f_min)
            overdue_vals.append(overdue_ratio)
            reschedule_vals.append(resched_rate)

            X.append([f_min, comp_rate, overdue_ratio, resched_rate, interrupts])

        X_mat = np.array(X)
        anomaly_detected = False

        try:
            iso = IsolationForest(contamination=0.15, random_state=42)
            preds = iso.fit_predict(X_mat)
            anomaly_detected = bool(preds[-1] == -1)  # Most recent day is anomaly
        except Exception:
            pass

        # Calculate metrics
        avg_focus = float(np.mean(focus_vals))
        recent_focus = focus_vals[-1]
        recent_overdue = overdue_vals[-1]
        recent_reschedule = reschedule_vals[-1]

        # Calculate burnout risk score
        risk_score = 20.0
        if recent_focus > 360:  # > 6 hours focus
            risk_score += 30.0
            contributing_indicators.append(f"Extended focus duration ({int(recent_focus)}m today)")
        elif recent_focus > 240:
            risk_score += 15.0
            contributing_indicators.append(f"High continuous focus ({int(recent_focus)}m)")

        if recent_overdue > 35.0:
            risk_score += 25.0
            contributing_indicators.append(f"Overdue task ratio is high ({int(recent_overdue)}%)")

        if recent_reschedule > 30.0:
            risk_score += 20.0
            contributing_indicators.append(f"High rescheduling rate ({int(recent_reschedule)}%)")

        if anomaly_detected:
            risk_score += 15.0
            contributing_indicators.append("Statistical workload anomaly detected relative to baseline")

        risk_score = float(np.clip(round(risk_score, 1), 5.0, 98.0))
        risk_level = "high" if risk_score >= 70.0 else ("moderate" if risk_score >= 40.0 else "low")

        # Trend calculation
        if len(focus_vals) >= 3:
            slope = np.polyfit(range(len(focus_vals)), focus_vals, 1)[0]
            workload_trend = "increasing" if slope > 10.0 else ("decreasing" if slope < -10.0 else "stable")
        else:
            workload_trend = "stable"

        # Tailored recommendations
        if risk_level == "high":
            recommendations.append("Incorporate a 45-minute offline recovery window")
            recommendations.append("Cap upcoming daily planned tasks to a maximum of 3 top priorities")
            recommendations.append("Kairo can automatically defer non-critical low-priority tasks")
        elif risk_level == "moderate":
            recommendations.append("Maintain regular 5-minute breaks between focus sessions")
            recommendations.append("Consolidate administrative tasks into afternoon low-energy block")
        else:
            contributing_indicators.append("Workload distribution is within optimal sustainable zone")
            recommendations.append("Pacing is optimal. Continue with current routine.")

        return BurnoutDetectionResponse(
            userId=user_id,
            burnoutRiskScore=risk_score,
            anomalyDetected=anomaly_detected,
            riskLevel=risk_level,
            contributingIndicators=contributing_indicators,
            workloadTrend=workload_trend,
            recommendations=recommendations,
            isColdStart=is_cold,
        )

    # ==========================================
    # 4. TIME-SERIES PRODUCTIVITY FORECASTING
    # ==========================================
    @classmethod
    def forecast_productivity(
        cls,
        user_id: str,
        historical_daily_stats: Optional[List[Dict[str, Any]]] = None,
        forecast_days_count: int = 7,
    ) -> ProductivityForecastResponse:
        forecast_days_count = max(1, min(30, forecast_days_count))
        is_cold = False
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        base_date = datetime.now(timezone.utc)
        forecast_days: List[DailyForecastModel] = []

        if not historical_daily_stats or len(historical_daily_stats) < 7:
            is_cold = True
            # Cold start baseline: 4-6 tasks completed per day, 120-180 focus mins
            for i in range(1, forecast_days_count + 1):
                target_date = base_date + timedelta(days=i)
                dow = target_date.weekday()
                is_weekend = dow >= 5
                pred_tasks = 2 if is_weekend else 5
                pred_focus = 60 if is_weekend else 140
                forecast_days.append(
                    DailyForecastModel(
                        date=target_date.strftime("%Y-%m-%d"),
                        dayOfWeek=dow + 1,
                        dayName=day_names[dow],
                        predictedTasksCompleted=pred_tasks,
                        predictedFocusMinutes=pred_focus,
                        confidenceLower=0.75,
                        confidenceUpper=0.90,
                    )
                )
            expected_weekly_comp = sum(f.predictedTasksCompleted for f in forecast_days[:7])
            expected_weekly_focus = sum(f.predictedFocusMinutes for f in forecast_days[:7])
            return ProductivityForecastResponse(
                userId=user_id,
                forecastDays=forecast_days,
                expectedWeeklyCompleted=expected_weekly_comp,
                expectedWeeklyFocusMinutes=expected_weekly_focus,
                trendDirection="steady",
                isColdStart=True,
            )

        # Regression forecasting on historical data
        completed_hist = [float(s.get("tasksCompleted", 4)) for s in historical_daily_stats]
        focus_hist = [float(s.get("focusMinutes", 120)) for s in historical_daily_stats]

        x_hist = np.arange(len(completed_hist))
        slope_tasks, intercept_tasks = np.polyfit(x_hist, completed_hist, 1)
        slope_focus, intercept_focus = np.polyfit(x_hist, focus_hist, 1)

        trend_direction = "upward" if slope_tasks > 0.15 else ("downward" if slope_tasks < -0.15 else "steady")

        for i in range(1, forecast_days_count + 1):
            target_date = base_date + timedelta(days=i)
            dow = target_date.weekday()
            is_weekend = dow >= 5

            idx_future = len(completed_hist) + i - 1
            raw_pred_tasks = max(1, int(round(slope_tasks * idx_future + intercept_tasks)))
            raw_pred_focus = max(30, int(round(slope_focus * idx_future + intercept_focus)))

            if is_weekend:
                raw_pred_tasks = max(1, int(round(raw_pred_tasks * 0.5)))
                raw_pred_focus = max(30, int(round(raw_pred_focus * 0.5)))

            conf_lower = float(np.clip(round(0.70 + (0.02 * (7 - min(i, 7))), 2), 0.60, 0.95))
            conf_upper = float(np.clip(round(conf_lower + 0.15, 2), 0.70, 0.98))

            forecast_days.append(
                DailyForecastModel(
                    date=target_date.strftime("%Y-%m-%d"),
                    dayOfWeek=dow + 1,
                    dayName=day_names[dow],
                    predictedTasksCompleted=raw_pred_tasks,
                    predictedFocusMinutes=raw_pred_focus,
                    confidenceLower=conf_lower,
                    confidenceUpper=conf_upper,
                )
            )

        expected_weekly_comp = sum(f.predictedTasksCompleted for f in forecast_days[:7])
        expected_weekly_focus = sum(f.predictedFocusMinutes for f in forecast_days[:7])

        return ProductivityForecastResponse(
            userId=user_id,
            forecastDays=forecast_days,
            expectedWeeklyCompleted=expected_weekly_comp,
            expectedWeeklyFocusMinutes=expected_weekly_focus,
            trendDirection=trend_direction,
            isColdStart=False,
        )

    # ==========================================
    # 5. SEMANTIC TASK CLUSTERING (TF-IDF + COSINE SIMILARITY)
    # ==========================================
    @classmethod
    def cluster_tasks_semantically(
        cls,
        tasks: List[TaskClusterItemModel],
        num_clusters: Optional[int] = None,
    ) -> TaskSemanticClusterResponse:
        if not tasks:
            return TaskSemanticClusterResponse(clusters=[], totalTasks=0)

        if len(tasks) <= 2:
            return TaskSemanticClusterResponse(
                clusters=[
                    TaskClusterModel(
                        clusterId=1,
                        topicName="General Tasks",
                        keywords=["task", "general"],
                        taskIds=[t.id for t in tasks],
                        taskCount=len(tasks),
                    )
                ],
                totalTasks=len(tasks),
            )

        # Build corpus
        corpus = []
        for t in tasks:
            text = f"{t.title} {t.category or ''} {' '.join(t.tags or [])}"
            corpus.append(text.lower().strip())

        k = num_clusters if num_clusters and num_clusters > 0 else min(5, max(2, int(math.sqrt(len(tasks)))))

        try:
            vectorizer = TfidfVectorizer(stop_words="english", max_features=100)
            X = vectorizer.fit_transform(corpus)
            feature_names = vectorizer.get_feature_names_out()

            kmeans = KMeans(n_clusters=k, random_state=42, n_init=5)
            labels = kmeans.fit_predict(X)

            clusters: List[TaskClusterModel] = []
            for c_id in range(k):
                member_indices = [i for i, lbl in enumerate(labels) if lbl == c_id]
                if not member_indices:
                    continue

                member_tasks = [tasks[i] for i in member_indices]
                task_ids = [t.id for t in member_tasks]

                # Extract top keywords for cluster center
                center = kmeans.cluster_centers_[c_id]
                top_word_indices = center.argsort()[-3:][::-1]
                keywords = [feature_names[idx] for idx in top_word_indices if idx < len(feature_names)]
                if not keywords:
                    keywords = [member_tasks[0].category or "General"]

                topic_name = " / ".join([w.capitalize() for w in keywords[:2]]) or f"Topic {c_id + 1}"

                clusters.append(
                    TaskClusterModel(
                        clusterId=c_id + 1,
                        topicName=topic_name,
                        keywords=keywords,
                        taskIds=task_ids,
                        taskCount=len(task_ids),
                    )
                )

            return TaskSemanticClusterResponse(clusters=clusters, totalTasks=len(tasks))
        except Exception:
            # Fallback by category
            cat_map: Dict[str, List[str]] = {}
            for t in tasks:
                cat = t.category or "General"
                cat_map.setdefault(cat, []).append(t.id)

            clusters = [
                TaskClusterModel(
                    clusterId=i + 1,
                    topicName=f"{cat} Tasks",
                    keywords=[cat.lower()],
                    taskIds=ids,
                    taskCount=len(ids),
                )
                for i, (cat, ids) in enumerate(cat_map.items())
            ]
            return TaskSemanticClusterResponse(clusters=clusters, totalTasks=len(tasks))
