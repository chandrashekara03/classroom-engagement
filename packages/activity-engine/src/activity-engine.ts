import { 
  Activity,
  ActivityResponse,
  QuizActivity,
  QuizResponse,
  PollActivity,
  PollResponse,
  FeedbackActivity,
  FeedbackResponse,
  WordRiddleActivity,
  WordRiddleResponse,
  TreasureHuntActivity,
  TreasureHuntResponse,
  PairingActivity,
  PairingResponse,
  ScenarioActivity,
  ScenarioResponse,
  Participant,
  Group,
  GroupingStrategy,
  calculateScore as utilCalculateScore
} from '@classroom/shared-utils';

export class ActivityEngine {
  /**
   * Validates if a response is valid for the given activity
   */
  static validateResponse(activity: Activity, response: ActivityResponse): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Basic validation
    if (!response.participantId) errors.push('Participant ID is required');
    if (!response.activityId) errors.push('Activity ID is required');
    if (response.activityId !== activity.id) errors.push('Activity ID mismatch');
    
    // Activity-specific validation
    switch (activity.type) {
      case 'QUIZ':
        errors.push(...this.validateQuizResponse(activity as QuizActivity, response as QuizResponse));
        break;
      case 'POLL':
        errors.push(...this.validatePollResponse(activity as PollActivity, response as PollResponse));
        break;
      case 'FEEDBACK':
        errors.push(...this.validateFeedbackResponse(activity as FeedbackActivity, response as FeedbackResponse));
        break;
      case 'WORD_RIDDLE':
        errors.push(...this.validateWordRiddleResponse(activity as WordRiddleActivity, response as WordRiddleResponse));
        break;
      case 'TREASURE_HUNT':
        errors.push(...this.validateTreasureHuntResponse(activity as TreasureHuntActivity, response as TreasureHuntResponse));
        break;
      case 'PAIRING':
        errors.push(...this.validatePairingResponse(activity as PairingActivity, response as PairingResponse));
        break;
      case 'SCENARIO':
        errors.push(...this.validateScenarioResponse(activity as ScenarioActivity, response as ScenarioResponse));
        break;
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Calculates the score for a response
   */
  static calculateScore(activity: Activity, response: ActivityResponse): number {
    return utilCalculateScore(activity, response);
  }
  
  /**
   * Generates groups for pairing activities
   */
  static generateGroups(
    participants: Participant[],
    groupSize: number,
    strategy: GroupingStrategy = 'RANDOM',
    previousGroups: Group[] = []
  ): Group[] {
    const availableParticipants = participants.filter(p => p.isOnline && p.isActive);
    const groups: Group[] = [];
    
    if (availableParticipants.length < 2) {
      return groups; // Not enough participants
    }
    
    let shuffledParticipants = [...availableParticipants];
    
    switch (strategy) {
      case 'RANDOM':
        shuffledParticipants = this.shuffleArray(shuffledParticipants);
        break;
        
      case 'AVOID_PREVIOUS':
        shuffledParticipants = this.avoidPreviousPairings(shuffledParticipants, previousGroups);
        break;
        
      case 'SKILL_BASED':
        // Sort by skill level (using score as proxy)
        shuffledParticipants.sort((a, b) => b.score - a.score);
        // Mix skill levels within groups
        shuffledParticipants = this.distributeBySkill(shuffledParticipants, groupSize);
        break;
        
      default:
        shuffledParticipants = this.shuffleArray(shuffledParticipants);
    }
    
    // Create groups
    for (let i = 0; i < shuffledParticipants.length; i += groupSize) {
      const groupMembers = shuffledParticipants.slice(i, i + groupSize);
      if (groupMembers.length >= Math.ceil(groupSize / 2)) { // Allow smaller last group
        groups.push({
          id: `group-${groups.length + 1}`,
          name: `Group ${groups.length + 1}`,
          members: groupMembers.map(p => p.id),
          createdAt: new Date()
        });
      }
    }
    
    return groups;
  }
  
  /**
   * Processes real-time activity updates
   */
  static processActivityUpdate(activity: Activity, responses: ActivityResponse[]): {
    leaderboard: Array<{ participantId: string; score: number; rank: number }>;
    completionRate: number;
    insights: string[];
  } {
    const leaderboard = this.generateLeaderboard(activity, responses);
    const completionRate = this.calculateCompletionRate(activity, responses);
    const insights = this.generateInsights(activity, responses);
    
    return { leaderboard, completionRate, insights };
  }
  
  /**
   * Determines if an activity should automatically end
   */
  static shouldAutoEnd(activity: Activity, responses: ActivityResponse[], participants: Participant[]): boolean {
    if (!participants.length) return false;
    
    const activeParticipants = participants.filter(p => p.isActive);
    const responseCount = responses.length;
    
    // End if all active participants have responded
    if (responseCount >= activeParticipants.length) return true;
    
    // Activity-specific auto-end conditions
    switch (activity.type) {
      case 'QUIZ':
        return false; // Quizzes should run their full duration
      case 'POLL':
        return responseCount >= Math.ceil(activeParticipants.length * 0.8); // 80% participation
      default:
        return false;
    }
  }
  
  // Private validation methods
  private static validateQuizResponse(activity: QuizActivity, response: QuizResponse): string[] {
    const errors: string[] = [];
    
    if (!response.answers || response.answers.length === 0) {
      errors.push('No answers provided');
      return errors;
    }
    
    response.answers.forEach((answer, index) => {
      const question = activity.questions.find(q => q.id === answer.questionId);
      if (!question) {
        errors.push(`Invalid question ID at answer ${index + 1}`);
        return;
      }
      
      if (question.type === 'SHORT_ANSWER' && !answer.textAnswer) {
        errors.push(`Text answer required for question ${index + 1}`);
      } else if (question.type !== 'SHORT_ANSWER' && (!answer.selectedOptions || answer.selectedOptions.length === 0)) {
        errors.push(`Selected options required for question ${index + 1}`);
      }
    });
    
    return errors;
  }
  
  private static validatePollResponse(activity: PollActivity, response: PollResponse): string[] {
    const errors: string[] = [];
    
    if (!response.selectedOptions || response.selectedOptions.length === 0) {
      errors.push('No options selected');
    }
    
    if (!activity.config.allowMultipleSelections && response.selectedOptions.length > 1) {
      errors.push('Multiple selections not allowed');
    }
    
    return errors;
  }
  
  private static validateFeedbackResponse(activity: FeedbackActivity, response: FeedbackResponse): string[] {
    const errors: string[] = [];
    
    if (!response.content || response.content.trim().length === 0) {
      errors.push('Feedback content is required');
    }
    
    if (response.content && response.content.length > activity.config.maxCharacters) {
      errors.push(`Feedback exceeds maximum length of ${activity.config.maxCharacters} characters`);
    }
    
    if (!activity.categories.includes(response.category)) {
      errors.push('Invalid feedback category');
    }
    
    return errors;
  }
  
  private static validateWordRiddleResponse(activity: WordRiddleActivity, response: WordRiddleResponse): string[] {
    const errors: string[] = [];
    
    if (!response.answer || response.answer.trim().length === 0) {
      errors.push('Answer is required');
    }
    
    if (response.attempts && response.attempts.length > activity.config.maxAttempts) {
      errors.push(`Exceeded maximum attempts (${activity.config.maxAttempts})`);
    }
    
    return errors;
  }
  
  private static validateTreasureHuntResponse(activity: TreasureHuntActivity, response: TreasureHuntResponse): string[] {
    const errors: string[] = [];
    
    if (!response.completedStages || response.completedStages.length === 0) {
      errors.push('No completed stages found');
    }
    
    response.completedStages.forEach((stage, index) => {
      const activityStage = activity.stages.find(s => s.id === stage.stageId);
      if (!activityStage) {
        errors.push(`Invalid stage ID at completion ${index + 1}`);
      }
    });
    
    return errors;
  }
  
  private static validatePairingResponse(activity: PairingActivity, response: PairingResponse): string[] {
    const errors: string[] = [];
    
    if (activity.config.allowSelfSelection && response.preferences) {
      if (response.preferences.length > activity.groupSize - 1) {
        errors.push('Too many preferences selected');
      }
    }
    
    return errors;
  }
  
  private static validateScenarioResponse(activity: ScenarioActivity, response: ScenarioResponse): string[] {
    const errors: string[] = [];
    
    if (!response.choices || response.choices.length === 0) {
      errors.push('No choices made');
    }
    
    response.choices.forEach((choice, index) => {
      const scenarioChoice = activity.choices.find(c => c.id === choice.choiceId);
      if (!scenarioChoice) {
        errors.push(`Invalid choice ID at decision ${index + 1}`);
      }
    });
    
    return errors;
  }
  
  // Helper methods
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  private static avoidPreviousPairings(participants: Participant[], previousGroups: Group[]): Participant[] {
    void previousGroups;
    // Simple implementation - shuffle and try to avoid recent pairings
    const shuffled = this.shuffleArray(participants);
    // TODO: Implement sophisticated pairing avoidance algorithm
    return shuffled;
  }
  
  private static distributeBySkill(participants: Participant[], groupSize: number): Participant[] {
    // Distribute high and low skill participants evenly
    const result: Participant[] = [];
    const groups = Math.ceil(participants.length / groupSize);
    
    for (let i = 0; i < groups; i++) {
      for (let j = 0; j < groupSize && (i * groupSize + j) < participants.length; j++) {
        const index = (i + j * groups) % participants.length;
        result.push(participants[index]);
      }
    }
    
    return result;
  }
  
  private static generateLeaderboard(activity: Activity, responses: ActivityResponse[]): Array<{ participantId: string; score: number; rank: number }> {
    const scores = responses.map(response => ({
      participantId: response.participantId,
      score: response.score || 0
    }));
    
    scores.sort((a, b) => b.score - a.score);
    
    return scores.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  }
  
  private static calculateCompletionRate(activity: Activity, responses: ActivityResponse[]): number {
    // This would need participant count from session state
    return responses.length > 0 ? 100 : 0; // Simplified
  }
  
  private static generateInsights(activity: Activity, responses: ActivityResponse[]): string[] {
    const insights: string[] = [];
    
    if (responses.length === 0) {
      insights.push('No responses received yet');
      return insights;
    }
    
    // Generate activity-specific insights
    switch (activity.type) {
      case 'QUIZ':
        const quizResponses = responses as QuizResponse[];
        const avgScore = quizResponses.reduce((sum, r) => sum + (r.score || 0), 0) / quizResponses.length;
        insights.push(`Average score: ${avgScore.toFixed(1)} points`);
        break;
        
      case 'POLL':
        insights.push(`${responses.length} participants have voted`);
        break;
        
      default:
        insights.push(`${responses.length} responses collected`);
    }
    
    return insights;
  }
}

export * from '@classroom/shared-utils';