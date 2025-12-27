"""
Personalization Service - Phase 10

ML/AI-powered content recommendations.
Currently using rule-based logic (mock).

Production: Integrate with ML model (e.g., collaborative filtering, LLM embeddings).
"""

from typing import List, Dict
from datetime import datetime

class PersonalizeService:
    """Content personalization service"""

    def __init__(self):
        # Mock recommendation pool
        self.all_recommendations = [
            "Chapter 1: Introduction to Physical AI",
            "Chapter 2: Embodied Intelligence Fundamentals",
            "Chapter 3: Humanoid Robotics Overview",
            "Chapter 4: Perception Systems for Robots",
            "Chapter 5: Action and Control Mechanisms",
            "Chapter 6: Learning Algorithms for Robotics",
            "Chapter 7: Future Trends in Physical AI",
            "Tutorial: Building Your First Humanoid",
            "Video: Understanding Sensor Fusion",
            "Video: Deep Reinforcement Learning for Robots",
            "Interactive Demo: Robot Arm Kinematics",
            "Case Study: Boston Dynamics Spot Robot",
        ]

    async def get_recommendations(
        self,
        user_email: str,
        user_tier: str,
        preferences: Dict = None,
        chat_history: List[Dict] = None
    ) -> Dict:
        """
        Generate personalized recommendations.

        Production TODO:
        - Load user interaction history from DB
        - Extract topics from chat_history using NLP
        - Compute embeddings for user preferences
        - Run collaborative filtering or content-based filtering
        - Rank recommendations by relevance score
        - Return top-N results

        Current: Rule-based mock
        """

        # Mock ML/AI logic (rule-based)
        recommendations = []

        # Tier-based filtering
        if user_tier == "premium":
            recommendations.extend(self.all_recommendations[:7])
        elif user_tier == "full":
            recommendations.extend(self.all_recommendations[:5])
        else:  # lightweight
            recommendations.extend(self.all_recommendations[:3])

        # Chat history analysis (mock)
        if chat_history:
            # Simple keyword matching
            keywords = self._extract_keywords(chat_history)
            if "sensor" in keywords or "perception" in keywords:
                recommendations.insert(0, "Video: Understanding Sensor Fusion")
            if "learning" in keywords or "training" in keywords:
                recommendations.insert(0, "Video: Deep Reinforcement Learning for Robots")

        # Preferences-based (mock)
        if preferences:
            difficulty = preferences.get("difficulty_level", "intermediate")
            if difficulty == "beginner":
                recommendations.insert(0, "Tutorial: Building Your First Humanoid")
            elif difficulty == "advanced":
                recommendations.insert(0, "Case Study: Boston Dynamics Spot Robot")

        # Deduplicate and limit
        recommendations = list(dict.fromkeys(recommendations))[:5]

        # Mock personalized content metadata
        personalized_content = {
            "difficulty_level": preferences.get("difficulty_level", "intermediate") if preferences else "intermediate",
            "learning_path": ["basics", "sensors", "control", "advanced"],
            "next_chapter": "perception-action-loops",
            "estimated_progress": "35%",
            "recommended_topics": ["sensor fusion", "deep RL", "kinematics"],
        }

        print(f"🤖 PERSONALIZATION (Mock ML/AI)")
        print(f"   User: {user_email}")
        print(f"   Tier: {user_tier}")
        print(f"   Recommendations: {len(recommendations)}")
        print(f"   Top 3: {recommendations[:3]}")

        return {
            "recommendations": recommendations,
            "personalized_content": personalized_content,
        }

    def _extract_keywords(self, chat_history: List[Dict]) -> List[str]:
        """
        Extract keywords from chat history (mock NLP).

        Production: Use spaCy, NLTK, or LLM for topic extraction.
        """
        keywords = []
        for msg in chat_history:
            content = msg.get("content", "").lower()
            # Simple keyword extraction (mock)
            if "sensor" in content:
                keywords.append("sensor")
            if "perception" in content:
                keywords.append("perception")
            if "learning" in content or "train" in content:
                keywords.append("learning")
            if "control" in content:
                keywords.append("control")
        return list(set(keywords))

# Singleton instance
personalize_service = PersonalizeService()
