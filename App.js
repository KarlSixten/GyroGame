import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Dimensions, Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';

const screenWidth = Math.floor(Dimensions.get('window').width);
const screenHeight = Math.floor(Dimensions.get('window').height);

const BALL_RADIUS = 25;
const CENTER_X = screenWidth / 2 - BALL_RADIUS;
const CENTER_Y = screenHeight / 2 - BALL_RADIUS;

export default function App() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [point, setPoint] = useState(generatePoint());

  function generatePoint() {
    const pointX = Math.random() * (screenWidth - BALL_RADIUS * 2);
    const pointY = Math.random() * (screenHeight - BALL_RADIUS * 2);
    return { x: pointX, y: pointY };
  }

  function checkPointCollision(ballX, ballY) {
    const distance = Math.sqrt(
      Math.pow(ballX - point.x, 2) + Math.pow(ballY - point.y, 2)
    );
    return distance < BALL_RADIUS * 2;
  }

  // Animated values for position
  const posX = useRef(new Animated.Value(CENTER_X)).current;
  const posY = useRef(new Animated.Value(CENTER_Y)).current;

  const velocityX = useRef(0);
  const velocityY = useRef(0);

  useEffect(() => {
    const subscription = Accelerometer.addListener(accelerometerData => {
      let adjustedX = accelerometerData.x;
      let adjustedY = accelerometerData.y;

      if (Platform.OS === 'android') {
        adjustedY = -accelerometerData.y;
        adjustedX = -accelerometerData.x;
      }

      velocityX.current += adjustedX * 1.1;
      velocityY.current -= adjustedY * 1.1;

      // Calculate new position
      let newX = posX.__getValue() + velocityX.current;
      let newY = posY.__getValue() + velocityY.current;

      // Check if the ball is out of bounds (center of ball)
      if (
        newX < -BALL_RADIUS || newX > screenWidth - BALL_RADIUS ||
        newY < -BALL_RADIUS || newY > screenHeight - BALL_RADIUS
      ) {
        if (score > highScore) {
          setHighScore(score);
        }
        setScore(0);
        velocityX.current = 0;
        velocityY.current = 0;
        newX = CENTER_X;
        newY = CENTER_Y;
      }

      if (checkPointCollision(newX, newY)) {
        setScore(score + 1);
        setPoint(generatePoint());
      }

      // Animate the ball's position
      posX.setValue(newX);
      posY.setValue(newY);
    });

    Accelerometer.setUpdateInterval(30);

    return () => subscription.remove();
  }, [point, score]);

  return (
    <View style={styles.container}>
      <Text style={styles.scoreText}>Score: {score}</Text>
      <Text style={styles.highScoreText}>Highscore: {highScore}</Text>
    
      {/* Rolling Ball */}
      <Animated.View style={[styles.ball, { transform: [{ translateX: posX }, { translateY: posY }] }]} />

      {/* Random Point */}
      <View
        style={[
          styles.point,
          { left: point.x, top: point.y }
        ]}
      />

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // Removed centering styles
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff6347', // Tomato color for score
    marginBottom: 20,
    marginTop: 100, // Added margin to move it down
  },
  highScoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#32cd32', // Lime green color for high score
    marginBottom: 40,
    marginTop: 20, // Added margin to space it out from the score
  },
  ball: {
    width: BALL_RADIUS * 2,
    height: BALL_RADIUS * 2,
    borderRadius: 25,
    backgroundColor: 'lightblue',
    position: 'absolute',  // Keeps the ball positioned based on Animated values
  },
  point: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'green',
    position: 'absolute',
  },
});