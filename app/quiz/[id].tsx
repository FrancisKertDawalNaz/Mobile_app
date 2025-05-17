import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Alert, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  timeLimit?: number; // in seconds
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

const quizzes: { [key: string]: Quiz } = {
  '1': {
    id: '1',
    title: 'Subnetting Quiz',
    description: 'Test your knowledge of subnetting concepts',
    questions: [
      {
        id: 1,
        question: 'What is the subnet mask for /24?',
        options: ['255.0.0.0', '255.255.0.0', '255.255.255.0', '255.255.255.255'],
        correctAnswer: '255.255.255.0',
        explanation: 'A /24 subnet mask has 24 bits set to 1, which is 255.255.255.0'
      },
      {
        id: 2,
        question: 'How many usable IP addresses are in a /24 network?',
        options: ['254', '255', '256', '512'],
        correctAnswer: '254',
        explanation: 'A /24 network has 256 addresses, but 2 are reserved (network and broadcast)'
      },
      {
        id: 3,
        question: 'What is the network address for 192.168.1.100/24?',
        options: ['192.168.1.0', '192.168.0.0', '192.168.1.1', '192.168.1.255'],
        correctAnswer: '192.168.1.0',
        explanation: 'The network address is the first address in the subnet'
      },
      {
        id: 4,
        question: 'What is the broadcast address for 192.168.1.100/24?',
        options: ['192.168.1.0', '192.168.1.255', '192.168.1.1', '192.168.1.254'],
        correctAnswer: '192.168.1.255',
        explanation: 'The broadcast address is the last address in the subnet'
      },
      {
        id: 5,
        question: 'How many subnets can be created with a /26 mask?',
        options: ['2', '4', '8', '16'],
        correctAnswer: '4',
        explanation: 'A /26 mask uses 2 bits for subnetting, creating 4 subnets'
      },
      {
        id: 6,
        question: 'What is the subnet mask for /16?',
        options: ['255.0.0.0', '255.255.0.0', '255.255.255.0', '255.255.255.255'],
        correctAnswer: '255.255.0.0',
        explanation: 'A /16 subnet mask has 16 bits set to 1, which is 255.255.0.0'
      },
      {
        id: 7,
        question: 'What is the subnet mask for /8?',
        options: ['255.0.0.0', '255.255.0.0', '255.255.255.0', '255.255.255.255'],
        correctAnswer: '255.0.0.0',
        explanation: 'A /8 subnet mask has 8 bits set to 1, which is 255.0.0.0'
      },
      {
        id: 8,
        question: 'How many usable IP addresses are in a /30 network?',
        options: ['2', '4', '6', '8'],
        correctAnswer: '2',
        explanation: 'A /30 network has 4 addresses, but 2 are reserved (network and broadcast)'
      },
      {
        id: 9,
        question: 'What is the subnet mask for /28?',
        options: ['255.255.255.240', '255.255.255.248', '255.255.255.252', '255.255.255.255'],
        correctAnswer: '255.255.255.240',
        explanation: 'A /28 subnet mask has 28 bits set to 1, which is 255.255.255.240'
      },
      {
        id: 10,
        question: 'How many subnets can be created with a /28 mask?',
        options: ['8', '16', '32', '64'],
        correctAnswer: '16',
        explanation: 'A /28 mask uses 4 bits for subnetting, creating 16 subnets'
      }
    ]
  },
  '2': {
    id: '2',
    title: 'Routing Protocols Quiz',
    description: 'Test your knowledge of routing protocols',
    questions: [
      {
        id: 1,
        question: 'Which protocol is used for routing between autonomous systems?',
        options: ['RIP', 'OSPF', 'BGP', 'EIGRP'],
        correctAnswer: 'BGP',
        explanation: 'BGP (Border Gateway Protocol) is the standard protocol for routing between autonomous systems'
      },
      {
        id: 2,
        question: 'Which routing protocol uses the Dijkstra algorithm?',
        options: ['RIP', 'OSPF', 'BGP', 'EIGRP'],
        correctAnswer: 'OSPF',
        explanation: 'OSPF uses the Dijkstra algorithm to calculate the shortest path'
      },
      {
        id: 3,
        question: 'What is the maximum hop count in RIP?',
        options: ['15', '16', '30', '255'],
        correctAnswer: '15',
        explanation: 'RIP has a maximum hop count of 15, with 16 being considered unreachable'
      },
      {
        id: 4,
        question: 'Which routing protocol is link-state?',
        options: ['RIP', 'OSPF', 'BGP', 'EIGRP'],
        correctAnswer: 'OSPF',
        explanation: 'OSPF is a link-state routing protocol that maintains a complete topology database'
      },
      {
        id: 5,
        question: 'What is the administrative distance of OSPF?',
        options: ['90', '100', '110', '120'],
        correctAnswer: '110',
        explanation: 'OSPF has an administrative distance of 110'
      },
      {
        id: 6,
        question: 'Which protocol uses the Bellman-Ford algorithm?',
        options: ['RIP', 'OSPF', 'BGP', 'EIGRP'],
        correctAnswer: 'RIP',
        explanation: 'RIP uses the Bellman-Ford algorithm for path calculation'
      },
      {
        id: 7,
        question: 'What is the default update interval for RIP?',
        options: ['15 seconds', '30 seconds', '60 seconds', '90 seconds'],
        correctAnswer: '30 seconds',
        explanation: 'RIP sends updates every 30 seconds by default'
      },
      {
        id: 8,
        question: 'Which routing protocol is path-vector?',
        options: ['RIP', 'OSPF', 'BGP', 'EIGRP'],
        correctAnswer: 'BGP',
        explanation: 'BGP is a path-vector protocol that makes routing decisions based on paths'
      },
      {
        id: 9,
        question: 'What is the administrative distance of EIGRP?',
        options: ['90', '100', '110', '120'],
        correctAnswer: '90',
        explanation: 'EIGRP has an administrative distance of 90'
      },
      {
        id: 10,
        question: 'Which protocol uses the DUAL algorithm?',
        options: ['RIP', 'OSPF', 'BGP', 'EIGRP'],
        correctAnswer: 'EIGRP',
        explanation: 'EIGRP uses the DUAL (Diffusing Update Algorithm) for path calculation'
      }
    ]
  },
  '3': {
    id: '3',
    title: 'Network Security Quiz',
    description: 'Test your knowledge of network security',
    questions: [
      {
        id: 1,
        question: 'Which attack involves sending fake ARP messages?',
        options: ['DDoS', 'ARP Spoofing', 'SQL Injection', 'XSS'],
        correctAnswer: 'ARP Spoofing',
        explanation: 'ARP Spoofing involves sending fake ARP messages to associate the attacker\'s MAC address with a legitimate IP address'
      },
      {
        id: 2,
        question: 'What is the purpose of a firewall?',
        options: [
          'To speed up network traffic',
          'To monitor and control network traffic',
          'To store network data',
          'To connect different networks'
        ],
        correctAnswer: 'To monitor and control network traffic',
        explanation: 'A firewall monitors and controls incoming and outgoing network traffic based on predetermined security rules'
      },
      {
        id: 3,
        question: 'What is a VPN used for?',
        options: [
          'To increase network speed',
          'To create a secure connection over the internet',
          'To store data',
          'To connect to a printer'
        ],
        correctAnswer: 'To create a secure connection over the internet',
        explanation: 'A VPN creates an encrypted tunnel for secure communication over the internet'
      },
      {
        id: 4,
        question: 'What is the purpose of SSL/TLS?',
        options: [
          'To speed up websites',
          'To encrypt data in transit',
          'To store passwords',
          'To compress files'
        ],
        correctAnswer: 'To encrypt data in transit',
        explanation: 'SSL/TLS provides encryption for data being transmitted over the network'
      },
      {
        id: 5,
        question: 'What is a DDoS attack?',
        options: [
          'A virus that spreads through email',
          'A distributed denial of service attack',
          'A type of firewall',
          'A network protocol'
        ],
        correctAnswer: 'A distributed denial of service attack',
        explanation: 'A DDoS attack floods a target with traffic from multiple sources'
      },
      {
        id: 6,
        question: 'What is the purpose of IDS?',
        options: [
          'To block all traffic',
          'To detect suspicious activity',
          'To speed up the network',
          'To store data'
        ],
        correctAnswer: 'To detect suspicious activity',
        explanation: 'An Intrusion Detection System monitors network traffic for suspicious activity'
      },
      {
        id: 7,
        question: 'What is two-factor authentication?',
        options: [
          'Using two passwords',
          'Using two usernames',
          'Using two different authentication methods',
          'Using two computers'
        ],
        correctAnswer: 'Using two different authentication methods',
        explanation: 'Two-factor authentication requires two different methods to verify identity'
      },
      {
        id: 8,
        question: 'What is a man-in-the-middle attack?',
        options: [
          'An attack that blocks all traffic',
          'An attack that intercepts communication',
          'An attack that deletes data',
          'An attack that speeds up the network'
        ],
        correctAnswer: 'An attack that intercepts communication',
        explanation: 'A man-in-the-middle attack intercepts and potentially alters communication between two parties'
      },
      {
        id: 9,
        question: 'What is the purpose of a DMZ?',
        options: [
          'To speed up the network',
          'To store sensitive data',
          'To provide a buffer zone between trusted and untrusted networks',
          'To connect to the internet'
        ],
        correctAnswer: 'To provide a buffer zone between trusted and untrusted networks',
        explanation: 'A DMZ (Demilitarized Zone) provides a buffer between internal and external networks'
      },
      {
        id: 10,
        question: 'What is the purpose of a honeypot?',
        options: [
          'To store honey',
          'To attract and monitor attackers',
          'To speed up the network',
          'To block all traffic'
        ],
        correctAnswer: 'To attract and monitor attackers',
        explanation: 'A honeypot is a decoy system designed to attract and monitor attackers'
      }
    ]
  }
};

export default function QuizScreen() {
  const { id } = useLocalSearchParams();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([]);
  const [startTime, setStartTime] = useState<number>(0);

  const quiz = quizzes[id as string];
  const question = quiz?.questions[currentQuestion];

  useEffect(() => {
    if (quiz?.timeLimit) {
      setTimeLeft(quiz.timeLimit);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 0) {
            clearInterval(timer);
            handleNextQuestion();
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentQuestion]);

  useEffect(() => {
    setStartTime(Date.now());
  }, []);

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

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    if (answer === question?.correctAnswer) {
      setScore(score + 1);
    }
    setShowExplanation(true);
  };

  const handleQuizComplete = async () => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000); // in seconds
    const newHistory: QuizHistory = {
      id: Date.now().toString(),
      quizId: id as string,
      quizTitle: quiz.title,
      score,
      totalQuestions: quiz.questions.length,
      date: new Date().toISOString(),
      timeTaken
    };

    try {
      const updatedHistory = [newHistory, ...quizHistory];
      setQuizHistory(updatedHistory);
      await AsyncStorage.setItem('quizHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving quiz history:', error);
    }

    setQuizCompleted(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      handleQuizComplete();
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizCompleted(false);
    if (quiz?.timeLimit) {
      setTimeLeft(quiz.timeLimit);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatTimeTaken = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const renderHistory = () => (
    <Modal visible={showHistory} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Quiz History</Text>
          <ScrollView style={styles.historyScroll}>
            {quizHistory
              .filter(history => history.quizId === id)
              .map(history => (
                <View key={history.id} style={styles.historyItem}>
                  <Text style={styles.historyDate}>{formatDate(history.date)}</Text>
                  <Text style={styles.historyScore}>
                    Score: {history.score}/{history.totalQuestions} ({((history.score / history.totalQuestions) * 100).toFixed(1)}%)
                  </Text>
                  <Text style={styles.historyTime}>Time: {formatTimeTaken(history.timeTaken)}</Text>
                </View>
              ))}
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={() => setShowHistory(false)}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (!quiz) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Quiz not found</Text>
      </SafeAreaView>
    );
  }

  if (quizCompleted) {
    const percentage = (score / quiz.questions.length) * 100;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completedContainer}>
          <Text style={styles.completedTitle}>Quiz Completed!</Text>
          <Text style={styles.scoreText}>
            Your Score: {score}/{quiz.questions.length} ({percentage.toFixed(1)}%)
          </Text>
          <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
            <Text style={styles.restartButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>{quiz.title}</Text>
          <TouchableOpacity style={styles.historyButton} onPress={() => setShowHistory(true)}>
            <Text style={styles.historyButtonText}>History</Text>
          </TouchableOpacity>
          <Text style={styles.progress}>
            Question {currentQuestion + 1} of {quiz.questions.length}
          </Text>
          {timeLeft !== null && (
            <Text style={styles.timer}>Time Left: {formatTime(timeLeft)}</Text>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.question}>{question?.question}</Text>

          <View style={styles.optionsContainer}>
            {question?.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedAnswer === option && styles.selectedOption,
                  showExplanation && option === question.correctAnswer && styles.correctOption,
                  showExplanation && selectedAnswer === option && option !== question.correctAnswer && styles.incorrectOption
                ]}
                onPress={() => !showExplanation && handleAnswer(option)}
                disabled={showExplanation}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {showExplanation && (
            <View style={styles.explanationContainer}>
              <Text style={styles.explanationTitle}>Explanation:</Text>
              <Text style={styles.explanationText}>{question?.explanation}</Text>
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNextQuestion}
              >
                <Text style={styles.nextButtonText}>
                  {currentQuestion < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      {renderHistory()}
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  progress: {
    fontSize: 14,
    color: '#666',
  },
  timer: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 5,
  },
  content: {
    padding: 20,
  },
  question: {
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
    lineHeight: 24,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedOption: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  correctOption: {
    borderColor: '#4CD964',
    backgroundColor: '#E8F5E9',
  },
  incorrectOption: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFEBEE',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  explanationContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 15,
    marginTop: 20,
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  explanationText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completedTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 24,
    color: '#666',
    marginBottom: 30,
  },
  restartButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
    marginBottom: 15,
  },
  restartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#333',
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
  historyScroll: {
    maxHeight: 400,
  },
  historyItem: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  historyScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  historyTime: {
    fontSize: 14,
    color: '#666',
  },
  historyButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
  },
  historyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
}); 