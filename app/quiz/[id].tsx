import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';

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

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    if (answer === question?.correctAnswer) {
      setScore(score + 1);
    }
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizCompleted(true);
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
}); 