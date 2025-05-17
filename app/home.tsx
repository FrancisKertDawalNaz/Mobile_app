import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizHistory {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  date: string;
  timeTaken: number;
}

export default function HomeScreen() {
  const [showProfile, setShowProfile] = useState(false);
  const [points, setPoints] = useState(100);
  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([]);

  const tutorials: Tutorial[] = [
    {
      id: '1',
      title: 'Subnetting Basics',
      description: 'Learn how to divide networks into smaller subnets',
      icon: '🌐',
      level: 'beginner'
    },
    {
      id: '2',
      title: 'Routing Protocols',
      description: 'Understand how data packets find their way through networks',
      icon: '🛣️',
      level: 'intermediate'
    },
    {
      id: '3',
      title: 'DNS Resolution',
      description: 'Master the Domain Name System and how it works',
      icon: '🔍',
      level: 'intermediate'
    },
    {
      id: '4',
      title: 'Network Security',
      description: 'Learn about firewalls, VPNs, and security protocols',
      icon: '🔒',
      level: 'advanced'
    }
  ];

  const quizzes: Quiz[] = [
    {
      id: '1',
      title: 'Subnetting Quiz',
      description: 'Test your subnetting knowledge',
      questionCount: 10,
      difficulty: 'medium'
    },
    {
      id: '2',
      title: 'Routing Basics',
      description: 'Basic routing concepts and protocols',
      questionCount: 10,
      difficulty: 'easy'
    },
    {
      id: '3',
      title: 'Network Security',
      description: 'Security protocols and best practices',
      questionCount: 10,
      difficulty: 'hard'
    }
  ];

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const savedHistory = await AsyncStorage.getItem('quizHistory');
        if (savedHistory) {
          setQuizHistory(JSON.parse(savedHistory));
        }
      } catch (error) {
        console.error('Error loading quiz history:', error);
      }
    };
    loadHistory();
  }, []);

  const calculateAverageScore = () => {
    if (quizHistory.length === 0) return 0;
    const totalScore = quizHistory.reduce((sum, quiz) => {
      return sum + (quiz.score / quiz.totalQuestions) * 100;
    }, 0);
    return (totalScore / quizHistory.length).toFixed(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getQuizPerformance = (quizId: string) => {
    const quizAttempts = quizHistory.filter(quiz => quiz.quizId === quizId);
    if (quizAttempts.length === 0) return null;

    const bestScore = Math.max(...quizAttempts.map(quiz => (quiz.score / quiz.totalQuestions) * 100));
    const attempts = quizAttempts.length;
    const averageScore = quizAttempts.reduce((sum, quiz) => sum + (quiz.score / quiz.totalQuestions) * 100, 0) / attempts;

    return {
      bestScore: bestScore.toFixed(1),
      attempts,
      averageScore: averageScore.toFixed(1)
    };
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#4CD964';
      case 'medium':
        return '#FF9500';
      case 'hard':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return '#4CD964';
      case 'intermediate':
        return '#FF9500';
      case 'advanced':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const handleLogout = () => {
    // Add logout logic here
    console.log('Logout pressed');
    setShowProfile(false);
  };

  const handleQuizComplete = async (newHistory: QuizHistory) => {
    try {
      const updatedHistory = [newHistory, ...quizHistory];
      setQuizHistory(updatedHistory);
      await AsyncStorage.setItem('quizHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving quiz history:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Network Learning Simulator</Text>
          <TouchableOpacity onPress={() => setShowProfile(true)} style={styles.profileIcon}>
            <Text style={styles.profileIconText}>👤</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interactive Tutorials</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tutorialsContainer}>
            {tutorials.map((tutorial) => (
              <TouchableOpacity
                key={tutorial.id}
                style={styles.tutorialCard}
                onPress={() => router.push(`/tutorial/${tutorial.id}`)}
              >
                <Text style={styles.tutorialIcon}>{tutorial.icon}</Text>
                <Text style={styles.tutorialTitle}>{tutorial.title}</Text>
                <Text style={styles.tutorialDescription}>{tutorial.description}</Text>
                <View style={[styles.levelBadge, { backgroundColor: getLevelColor(tutorial.level) }]}>
                  <Text style={styles.levelText}>{tutorial.level}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Practice Quizzes</Text>
          {quizzes.map((quiz) => (
            <TouchableOpacity
              key={quiz.id}
              style={styles.quizCard}
              onPress={() => router.push(`/quiz/${quiz.id}`)}
            >
              <View style={styles.quizHeader}>
                <Text style={styles.quizTitle}>{quiz.title}</Text>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(quiz.difficulty) }]}>
                  <Text style={styles.difficultyText}>{quiz.difficulty}</Text>
                </View>
              </View>
              <Text style={styles.quizDescription}>{quiz.description}</Text>
              <Text style={styles.questionCount}>{quiz.questionCount} questions</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network Simulator</Text>
          <TouchableOpacity
            style={styles.simulatorCard}
            onPress={() => router.push('/simulator')}
          >
            <Text style={styles.simulatorTitle}>Packet Transfer Simulation</Text>
            <Text style={styles.simulatorDescription}>
              Visualize how data packets travel through a network
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
      <Modal
        visible={showProfile}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProfile(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>User Profile</Text>
            
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>Overall Performance</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{calculateAverageScore()}%</Text>
                  <Text style={styles.statLabel}>Average Score</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{quizHistory.length}</Text>
                  <Text style={styles.statLabel}>Total Attempts</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{points}</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>
              </View>
              
              <View style={styles.recentHistoryContainer}>
                <Text style={styles.recentHistoryTitle}>Recent Quiz History</Text>
                <ScrollView style={styles.recentHistoryScroll}>
                  {quizHistory.slice(0, 5).map((history) => (
                    <View key={history.id} style={styles.recentHistoryItem}>
                      <View style={styles.recentHistoryHeader}>
                        <Text style={styles.recentHistoryQuiz}>{history.quizTitle}</Text>
                        <Text style={styles.recentHistoryDate}>{formatDate(history.date)}</Text>
                      </View>
                      <View style={styles.recentHistoryStats}>
                        <Text style={styles.recentHistoryScore}>
                          Score: {history.score}/{history.totalQuestions} ({((history.score / history.totalQuestions) * 100).toFixed(1)}%)
                        </Text>
                        <Text style={styles.recentHistoryTime}>
                          Time: {Math.floor(history.timeTaken / 60)}m {history.timeTaken % 60}s
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>

            <ScrollView style={styles.quizHistoryContainer}>
              <Text style={styles.historyTitle}>Quiz Performance</Text>
              {['1', '2', '3'].map(quizId => {
                const performance = getQuizPerformance(quizId);
                if (!performance) return null;

                const quizTitle = quizHistory.find(q => q.quizId === quizId)?.quizTitle || 'Unknown Quiz';
                return (
                  <View key={quizId} style={styles.quizHistoryItem}>
                    <Text style={styles.quizTitle}>{quizTitle}</Text>
                    <View style={styles.quizStats}>
                      <Text style={styles.quizStat}>Best Score: {performance.bestScore}%</Text>
                      <Text style={styles.quizStat}>Attempts: {performance.attempts}</Text>
                      <Text style={styles.quizStat}>Average: {performance.averageScore}%</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowProfile(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 20,
  },
  profileIcon: {
    padding: 10,
    marginLeft: -40,
  },
  profileIconText: {
    fontSize: 24,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  tutorialsContainer: {
    marginBottom: 20,
  },
  tutorialCard: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 15,
    marginRight: 15,
    width: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tutorialIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  tutorialTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  tutorialDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  levelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  quizCard: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  quizDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  questionCount: {
    fontSize: 12,
    color: '#999',
  },
  simulatorCard: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  simulatorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  simulatorDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    margin: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  quizHistoryContainer: {
    maxHeight: 300,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  quizHistoryItem: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  quizStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quizStat: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  recentHistoryContainer: {
    marginTop: 20,
  },
  recentHistoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  recentHistoryScroll: {
    maxHeight: 200,
  },
  recentHistoryItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  recentHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentHistoryQuiz: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  recentHistoryDate: {
    fontSize: 12,
    color: '#666',
  },
  recentHistoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentHistoryScore: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  recentHistoryTime: {
    fontSize: 12,
    color: '#666',
  },
}); 