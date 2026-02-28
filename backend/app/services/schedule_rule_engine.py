"""
EduSense - Schedule Rule Engine

Deterministic rule-based scheduler for generating study schedules from concepts.
Uses time allocation algorithms without AI - pure logic and heuristics.
Generates TimelinePlan with milestones and StudyBlocks with key points.
"""

from datetime import datetime, timedelta, time
from typing import List, Dict, Any, Optional
from app.models.study_material import Concept
from app.models.study_schedule import StudyBlock, TimelinePlan, Milestone


from datetime import datetime, timedelta, time
from typing import List, Dict, Any, Optional, Tuple
from app.models.study_material import Concept
from app.models.study_schedule import StudyBlock, TimelinePlan, Milestone


async def generate_complete_schedule(
    concepts: List[Dict[str, Any]],
    task_title: str,
    subject: str,
    deadline: datetime,
    material_key_points: List[str] = None,
    start_date: Optional[datetime] = None
) -> Tuple[List[StudyBlock], TimelinePlan]:
    """
    Generate a complete study schedule with timeline plan and study blocks.
    
    This is the main entry point for schedule generation, combining all rules
    and producing structured data ready to save to StudySchedule model.
    
    Args:
        concepts: List of concept dicts with id, title, summary, difficulty, estimated_minutes, key_points
        task_title: Title of the task/goal
        subject: Subject name
        deadline: Target deadline
        material_key_points: Overall key points from study materials
        start_date: When to start (default: now)
        
    Returns:
        Tuple of (study_blocks, timeline_plan)
    """
    if start_date is None:
        start_date = datetime.now()
    
    # Ensure deadline is in the future
    if deadline <= start_date:
        deadline = start_date + timedelta(days=7)
    
    days_remaining = (deadline - start_date).days + 1
    
    # Sort concepts by priority: deadline proximity + difficulty
    difficulty_weight = {"hard": 3, "medium": 2, "easy": 1}
    sorted_concepts = sorted(
        concepts,
        key=lambda c: (difficulty_weight.get(c.get("difficulty", "medium"), 2), c.get("estimated_minutes", 30)),
        reverse=True  # Hard and longer concepts first
    )
    
    # Generate study blocks
    blocks = []
    current_date = start_date
    concept_index = 0
    consecutive_study_blocks = 0
    scheduled_concepts = []
    
    # Default availability: 9 AM - 9 PM
    daily_start = time(9, 0)
    daily_end = time(21, 0)
    focus_block_minutes = 45
    break_minutes = 10
    
    # Allocate blocks
    while concept_index < len(sorted_concepts) and current_date < deadline:
        date_str = current_date.strftime('%Y-%m-%d')
        current_time = datetime.combine(current_date.date(), daily_start)
        end_of_day = datetime.combine(current_date.date(), daily_end)
        
        # Schedule blocks for this day
        while current_time < end_of_day and concept_index < len(sorted_concepts):
            concept = sorted_concepts[concept_index]
            
            # Check if we need a longer break
            if consecutive_study_blocks >= 3:
                long_break_minutes = 20
                break_end = current_time + timedelta(minutes=long_break_minutes)
                
                if break_end <= end_of_day:
                    blocks.append(StudyBlock(
                        date=date_str,
                        start_time=current_time.strftime('%H:%M'),
                        end_time=break_end.strftime('%H:%M'),
                        subject=subject,
                        concept_title="Long Break",
                        type="break",
                        key_points=["Rest and recharge", "Stay hydrated", "Light stretching"]
                    ))
                    current_time = break_end
                    consecutive_study_blocks = 0
                else:
                    break  # Move to next day
            
            # Add study block for concept
            time_needed = concept.get("estimated_minutes", 30)
            block_duration = min(focus_block_minutes, time_needed)
            block_end = current_time + timedelta(minutes=block_duration)
            
            if block_end <= end_of_day:
                # Extract key points for this concept
                concept_key_points = []
                if "summary" in concept and concept["summary"]:
                    # Take first sentence or two from summary
                    summary_parts = concept["summary"].split('. ')
                    concept_key_points.append(summary_parts[0])
                
                # Add from material key points if available
                if material_key_points:
                    # Find relevant key points (simple matching)
                    for kp in material_key_points[:3]:
                        if any(word.lower() in kp.lower() for word in concept.get("title", "").split()[:3]):
                            concept_key_points.append(kp)
                            break
                
                # Ensure at least one key point
                if not concept_key_points:
                    concept_key_points = [f"Focus on understanding {concept.get('title', 'this topic')}"]
                
                blocks.append(StudyBlock(
                    date=date_str,
                    start_time=current_time.strftime('%H:%M'),
                    end_time=block_end.strftime('%H:%M'),
                    subject=subject,
                    concept_title=concept.get("title", "Study Session"),
                    concept_id=concept.get("id"),
                    type="study",
                    key_points=concept_key_points[:3]  # Max 3 key points per block
                ))
                
                current_time = block_end
                consecutive_study_blocks += 1
                scheduled_concepts.append(concept)
                concept_index += 1
                
                # Add short break
                if concept_index < len(sorted_concepts) and consecutive_study_blocks < 3:
                    break_end = current_time + timedelta(minutes=break_minutes)
                    if break_end <= end_of_day:
                        blocks.append(StudyBlock(
                            date=date_str,
                            start_time=current_time.strftime('%H:%M'),
                            end_time=break_end.strftime('%H:%M'),
                            subject=subject,
                            concept_title="Short Break",
                            type="break",
                            key_points=["Quick rest"]
                        ))
                        current_time = break_end
            else:
                break  # Move to next day
        
        # Move to next day
        current_date += timedelta(days=1)
        consecutive_study_blocks = 0
    
    # Add review session 1 day before deadline
    if days_remaining > 1:
        review_date = (deadline - timedelta(days=1)).strftime('%Y-%m-%d')
        blocks.append(StudyBlock(
            date=review_date,
            start_time="10:00",
            end_time="12:00",
            subject=subject,
            concept_title="Final Review Session",
            type="review",
            key_points=[
                "Review all studied concepts",
                "Practice key problems",
                "Clarify any doubts"
            ]
        ))
    
    # Generate timeline plan with milestones
    timeline = _generate_timeline_plan(
        task_title=task_title,
        days_remaining=days_remaining,
        start_date=start_date,
        deadline=deadline,
        total_concepts=len(concepts),
        scheduled_concepts=len(scheduled_concepts)
    )
    
    return blocks, timeline


def _generate_timeline_plan(
    task_title: str,
    days_remaining: int,
    start_date: datetime,
    deadline: datetime,
    total_concepts: int,
    scheduled_concepts: int
) -> TimelinePlan:
    """
    Generate a timeline plan with milestones distributed across the schedule.
    
    Args:
        task_title: Goal/task title
        days_remaining: Total days available
        start_date: Start date
        deadline: End date
        total_concepts: Total concepts to study
        scheduled_concepts: Number of concepts scheduled
        
    Returns:
        TimelinePlan object with milestones
    """
    milestones = []
    
    # Milestone 1: Foundation (first 20% of time)
    foundation_date = start_date + timedelta(days=int(days_remaining * 0.2))
    milestones.append(Milestone(
        date=foundation_date.strftime('%Y-%m-%d'),
        label="Foundation",
        target=f"Complete basic concepts (first {int(total_concepts * 0.3)} topics)",
        tips="Focus on fundamentals, take good notes"
    ))
    
    # Milestone 2: Core Topics (50% of time)
    core_date = start_date + timedelta(days=int(days_remaining * 0.5))
    milestones.append(Milestone(
        date=core_date.strftime('%Y-%m-%d'),
        label="Core Topics",
        target=f"Master main concepts (70% of material)",
        tips="Practice problems, connect ideas"
    ))
    
    # Milestone 3: Advanced/Application (80% of time)
    advanced_date = start_date + timedelta(days=int(days_remaining * 0.8))
    if days_remaining > 3:
        milestones.append(Milestone(
            date=advanced_date.strftime('%Y-%m-%d'),
            label="Deep Dive",
            target="Apply knowledge, work on complex problems",
            tips="Focus on application and problem-solving"
        ))
    
    # Milestone 4: Final Review (last day)
    milestones.append(Milestone(
        date=deadline.strftime('%Y-%m-%d'),
        label="Final Review",
        target="Review all material, confidence check",
        tips="Consolidate learning, stay calm"
    ))
    
    # Success criteria
    success_criteria = [
        f"Complete all {total_concepts} concepts before deadline",
        "Achieve understanding of core principles",
        "Practice application through problems",
        "Feel confident with the material"
    ]
    
    return TimelinePlan(
        goal_title=task_title,
        days_remaining=days_remaining,
        milestones=milestones,
        success_criteria=success_criteria
    )


def generate_schedule_from_concepts(
    concepts: List[Concept],
    deadline: datetime,
    availability: Dict[str, List[Dict[str, str]]] = None,
    focus_block_minutes: int = 50,
    break_minutes: int = 10,
    start_date: Optional[datetime] = None
) -> List[Dict[str, Any]]:
    """
    Generate a structured study schedule from a list of concepts using rule-based logic.
    
    Args:
        concepts: List of Concept objects to schedule
        deadline: Target deadline for completing all concepts
        availability: Dict mapping day names to available time windows
                     e.g., {"monday": [{"start": "09:00", "end": "17:00"}]}
                     If None, defaults to 9 AM - 9 PM daily
        focus_block_minutes: Duration of each study block (default: 50)
        break_minutes: Duration of breaks between blocks (default: 10)
        start_date: When to start scheduling (default: now)
        
    Returns:
        List of schedule blocks with date, time, title, and type information
        
    Scheduling Rules:
        1. Hard concepts scheduled first (when mind is fresh)
        2. Maximum 3 consecutive focus blocks before longer break
        3. Review sessions inserted 1-2 days before deadline
        4. Breaks automatically inserted between study blocks
        5. Respects daily availability windows
    """
    if not concepts:
        return []
    
    # Initialize start date
    if start_date is None:
        start_date = datetime.now()
    
    # Ensure deadline is in the future
    if deadline <= start_date:
        deadline = start_date + timedelta(days=7)  # Default to 1 week if invalid
    
    # Calculate available days
    days_available = (deadline - start_date).days + 1
    
    # Set default availability (9 AM - 9 PM daily) if not provided
    if availability is None:
        availability = _get_default_availability()
    
    # Step 1: Sort concepts by difficulty (hard first, then medium, then easy)
    difficulty_order = {"hard": 1, "medium": 2, "easy": 3}
    sorted_concepts = sorted(
        concepts,
        key=lambda c: (difficulty_order.get(c.difficulty, 2), c.estimated_minutes),
        reverse=False  # Lower numbers first (hard = 1)
    )
    
    # Step 2: Build schedule blocks
    schedule_blocks = []
    current_date = start_date
    concept_index = 0
    consecutive_focus_blocks = 0
    
    # Track which concepts to review
    concepts_for_review = []
    
    # Schedule study sessions for each concept
    while concept_index < len(sorted_concepts) and current_date < deadline:
        # Get availability for current day
        day_name = current_date.strftime('%A').lower()
        day_availability = availability.get(day_name, availability.get('default', []))
        
        if not day_availability:
            # Skip days with no availability
            current_date += timedelta(days=1)
            consecutive_focus_blocks = 0  # Reset counter on new day
            continue
        
        # Process each availability window for the day
        for window in day_availability:
            window_start = _parse_time(window['start'])
            window_end = _parse_time(window['end'])
            
            current_time = datetime.combine(current_date.date(), window_start)
            window_end_dt = datetime.combine(current_date.date(), window_end)
            
            # Schedule blocks within this window
            while current_time < window_end_dt and concept_index < len(sorted_concepts):
                concept = sorted_concepts[concept_index]
                
                # Check if we need a longer break (after 3 consecutive focus blocks)
                if consecutive_focus_blocks >= 3:
                    # Insert longer break (20-30 minutes)
                    long_break_minutes = 20
                    break_end = current_time + timedelta(minutes=long_break_minutes)
                    
                    if break_end <= window_end_dt:
                        schedule_blocks.append({
                            "date": current_time.strftime('%Y-%m-%d'),
                            "start_time": current_time.strftime('%H:%M'),
                            "end_time": break_end.strftime('%H:%M'),
                            "title": "Long Break - Recharge",
                            "type": "break",
                            "duration_minutes": long_break_minutes
                        })
                        current_time = break_end
                        consecutive_focus_blocks = 0
                    else:
                        break  # Move to next window or day
                
                # Calculate how much time we need for this concept
                time_needed = concept.estimated_minutes
                
                # Split into focus blocks if concept needs more time than one block
                while time_needed > 0 and current_time < window_end_dt:
                    # Determine block duration (up to focus_block_minutes)
                    block_duration = min(focus_block_minutes, time_needed)
                    block_end = current_time + timedelta(minutes=block_duration)
                    
                    # Check if block fits in current window
                    if block_end > window_end_dt:
                        break  # Move to next window or day
                    
                    # Add study block
                    schedule_blocks.append({
                        "date": current_time.strftime('%Y-%m-%d'),
                        "start_time": current_time.strftime('%H:%M'),
                        "end_time": block_end.strftime('%H:%M'),
                        "title": f"Study: {concept.title}",
                        "concept_id": str(concept.id),
                        "difficulty": concept.difficulty,
                        "type": "study",
                        "duration_minutes": block_duration
                    })
                    
                    current_time = block_end
                    time_needed -= block_duration
                    consecutive_focus_blocks += 1
                    
                    # Add short break if more time needed or more concepts to schedule
                    if time_needed > 0 or concept_index < len(sorted_concepts) - 1:
                        if consecutive_focus_blocks < 3:  # Only short break if under limit
                            break_end = current_time + timedelta(minutes=break_minutes)
                            if break_end <= window_end_dt:
                                schedule_blocks.append({
                                    "date": current_time.strftime('%Y-%m-%d'),
                                    "start_time": current_time.strftime('%H:%M'),
                                    "end_time": break_end.strftime('%H:%M'),
                                    "title": "Short Break",
                                    "type": "break",
                                    "duration_minutes": break_minutes
                                })
                                current_time = break_end
                
                # Move to next concept if current one is fully scheduled
                if time_needed <= 0:
                    concepts_for_review.append(concept)
                    concept_index += 1
                
                # Check if we're out of time in this window
                if current_time >= window_end_dt:
                    break
        
        # Move to next day
        current_date += timedelta(days=1)
        consecutive_focus_blocks = 0  # Reset counter on new day
    
    # Step 3: Insert review sessions near the deadline
    # Schedule reviews 1-2 days before deadline
    review_date = deadline - timedelta(days=1)
    
    if review_date > start_date and concepts_for_review:
        day_name = review_date.strftime('%A').lower()
        day_availability = availability.get(day_name, availability.get('default', []))
        
        if day_availability:
            window = day_availability[0]  # Use first available window
            window_start = _parse_time(window['start'])
            review_time = datetime.combine(review_date.date(), window_start)
            
            # Add a comprehensive review session
            review_duration = min(90, len(concepts_for_review) * 10)  # 10 min per concept, max 90 min
            review_end = review_time + timedelta(minutes=review_duration)
            
            schedule_blocks.append({
                "date": review_time.strftime('%Y-%m-%d'),
                "start_time": review_time.strftime('%H:%M'),
                "end_time": review_end.strftime('%H:%M'),
                "title": "Comprehensive Review Session",
                "type": "review",
                "duration_minutes": review_duration,
                "concepts_to_review": len(concepts_for_review)
            })
    
    # Step 4: Sort all blocks by date and time
    schedule_blocks.sort(key=lambda b: (b['date'], b['start_time']))
    
    return schedule_blocks


def _get_default_availability() -> Dict[str, List[Dict[str, str]]]:
    """
    Get default availability schedule (9 AM - 9 PM daily).
    
    Returns:
        Dictionary mapping day names to time windows
    """
    default_window = [{"start": "09:00", "end": "21:00"}]
    
    return {
        "monday": default_window,
        "tuesday": default_window,
        "wednesday": default_window,
        "thursday": default_window,
        "friday": default_window,
        "saturday": default_window,
        "sunday": default_window,
        "default": default_window
    }


def _parse_time(time_str: str) -> time:
    """
    Parse time string in HH:MM format to time object.
    
    Args:
        time_str: Time string (e.g., "09:00", "14:30")
        
    Returns:
        time object
    """
    try:
        hour, minute = map(int, time_str.split(':'))
        return time(hour=hour, minute=minute)
    except (ValueError, AttributeError):
        # Default to 9 AM if parsing fails
        return time(hour=9, minute=0)


def calculate_total_study_time(concepts: List[Concept]) -> int:
    """
    Calculate total estimated study time for a list of concepts.
    
    Args:
        concepts: List of Concept objects
        
    Returns:
        Total minutes needed
    """
    return sum(concept.estimated_minutes for concept in concepts)


def validate_schedule_feasibility(
    concepts: List[Concept],
    deadline: datetime,
    availability: Dict[str, List[Dict[str, str]]] = None,
    start_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Check if the concepts can realistically be scheduled before the deadline.
    
    Args:
        concepts: List of Concept objects to schedule
        deadline: Target deadline
        availability: Available time windows
        start_date: When to start (default: now)
        
    Returns:
        Dictionary with feasibility analysis
    """
    if start_date is None:
        start_date = datetime.now()
    
    # Calculate total time needed
    total_minutes = calculate_total_study_time(concepts)
    
    # Calculate available time slots
    days_available = (deadline - start_date).days + 1
    
    if availability is None:
        # Default: 12 hours per day
        available_minutes = days_available * 720
    else:
        # Calculate based on actual availability
        available_minutes = 0
        for day_windows in availability.values():
            for window in day_windows:
                start = _parse_time(window['start'])
                end = _parse_time(window['end'])
                duration = (datetime.combine(datetime.today(), end) - 
                           datetime.combine(datetime.today(), start))
                available_minutes += duration.total_seconds() / 60
        
        available_minutes *= days_available / 7  # Average per week
    
    # Account for breaks (roughly 20% overhead)
    effective_available = available_minutes * 0.8
    
    is_feasible = total_minutes <= effective_available
    utilization = (total_minutes / effective_available * 100) if effective_available > 0 else 100
    
    return {
        "feasible": is_feasible,
        "total_study_minutes": total_minutes,
        "available_minutes": int(effective_available),
        "utilization_percentage": round(utilization, 1),
        "days_available": days_available,
        "concepts_count": len(concepts),
        "recommendation": _get_feasibility_recommendation(utilization)
    }


def _get_feasibility_recommendation(utilization: float) -> str:
    """Get a recommendation based on schedule utilization."""
    if utilization > 100:
        return "Not feasible - Consider extending deadline or reducing scope"
    elif utilization > 80:
        return "Very tight schedule - Little room for flexibility"
    elif utilization > 60:
        return "Challenging but achievable - Stay focused"
    elif utilization > 40:
        return "Comfortable schedule - Good balance"
    else:
        return "Plenty of time - Consider adding more depth"
