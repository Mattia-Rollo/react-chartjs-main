import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

const helicopterRise = keyframes`
  0% {
    bottom: -2%;
    transform: translate(-50%, 0);
  }
  100% {
    bottom: 40%;
    transform: translate(-50%, 0);
  }
`;

const helicopterFloat = keyframes`
  0%, 100% {
    transform: translate(-50%, -10px);
  }
  50% {
    transform: translate(-50%, 10px);
  }
`;

const helicopterTiltAndMove = keyframes`
  0% {
    left: 50%;
    transform: translate(-50%, 0) rotate(0deg);
  }
  20% {
    transform: translate(-50%, 0) rotate(-15deg);
  }
  100% {
    left: -150%;
    transform: translate(-50%, 0) rotate(-15deg);
  }
`;

const topWingRotate = keyframes`
  0% {
    transform: rotate3d(0, 1, 0, 0deg);
  }
  100% {
    transform: rotate3d(0, 1, 0, 360deg);	
  }
`;

const bottomWingRotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const HelicopterContainer = styled(Box)({
  position: 'fixed',
  left: '50%',
  bottom: '40%',
  width: 450,
  boxSizing: "border-box",
  animation: `
    ${helicopterRise} 2s cubic-bezier(0.25, 0.1, 0.25, 1),
    ${helicopterFloat} 1s ease-in-out infinite,
    ${helicopterTiltAndMove} 3s ease-in-out 4s forwards
  `
});

const TopWing = styled(Box)({
  backgroundColor: "black",
  height: 10,
  width: 25,
  margin: 0,
  padding: 0,
  position: "relative",
  left: 147,
  top: 0,
  transform: "rotate3d(0, 1, 0, 0deg)",
  animation: `${topWingRotate} 0.5s linear 0.5s infinite`,
  "&:after": {
    content: '""',
    backgroundColor: "black",
    height: 8,
    width: 250,
    margin: 0,
    padding: 0,
    position: "absolute",
    left: 0,
    top: 1,
    borderRadius: 20,
  },
  "&:before": {
    content: '""',
    backgroundColor: "black",
    height: 8,
    width: 250,
    margin: 0,
    padding: 0,
    position: "absolute",
    right: 0,
    top: 1,
    borderRadius: 20,
  },
});

const TopWingMiddle = styled(Box)({
  backgroundColor: "black",
  height: 5,
  width: 20,
  margin: "0 0 0 150px",
  padding: 0,
});

const TopWingBottom = styled(Box)({
  backgroundColor: "black",
  height: 10,
  width: 30,
  margin: "0 0 0 145px",
  padding: 0,
  borderRadius: 50,
});

const FrontTop = styled(Box)({
  backgroundColor: "#d32f2f",
  height: 20,
  width: 120,
  margin: "-4px 0 0 80px",
  padding: 0,
  borderTopLeftRadius: 50,
  borderTopRightRadius: 50,
});

const Front = styled(Box)({
  backgroundColor: "#d32f2f",
  height: 100,
  width: 175,
  margin: 0,
  padding: 0,
  borderTopLeftRadius: 100,
  borderBottomLeftRadius: 50,
  position: "relative",
  float: "left",
  "&:after": {
    content: '""',
    height: 0,
    width: 50,
    margin: 0,
    padding: 0,
    borderTop: "100px solid #d32f2f",
    borderLeft: "0px solid transparent",
    borderRight: "20px solid transparent",
    borderBottom: "0px solid transparent",
    position: "absolute",
    right: -50,
    top: 0,
  },
});

const Glass = styled(Box)({
  backgroundColor: "#A9A9A9",
  height: 40,
  width: 80,
  margin: 0,
  padding: 0,
  borderTopLeftRadius: 200,
  borderBottomLeftRadius: 0,
  position: "absolute",
  top: 10,
  left: 18,
  "&:after": {
    content: '""',
    backgroundColor: "#A9A9A9",
    height: 40,
    width: 40,
    margin: 0,
    padding: 0,
    position: "absolute",
    top: 0,
    right: -45,
  },
});

const Unglass = styled(Box)({
  backgroundColor: "#A9A9A9",
  height: 40,
  width: 80,
  margin: 0,
  padding: 0,
  borderTopLeftRadius: 0,
  borderBottomLeftRadius: 200,
  position: "absolute",
  bottom: 5,
  left: 18,
  "&:after": {
    content: '""',
    backgroundColor: "#d32f2f",
    height: 40,
    width: 80,
    margin: 0,
    padding: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 200,
    position: "absolute",
    bottom: 0,
    right: -50,
  },
});

const Black = styled(Box)({
  backgroundColor: "#d32f2f",
  height: 40,
  width: 175,
  margin: 0,
  padding: 0,
  position: "relative",
  top: 5,
  left: 45,
  float: "left",
  "&:after": {
    content: '""',
    backgroundColor: "#d32f2f",
    height: 40,
    width: 200,
    margin: 0,
    padding: 0,
    position: "absolute",
    right: 4,
    top: 10,
    transform: "rotate(-5deg)",
    zIndex: -1,
  },
  "&:before": {
    content: '""',
    borderTop: "0px solid transparent",
    borderLeft: "20px solid transparent",
    borderRight: "0px solid transparent",
    borderBottom: "50px solid #d32f2f",
    height: 0,
    width: 20,
    margin: 0,
    padding: 0,
    position: "absolute",
    right: -40,
    top: -50,
  },
});

const Middle = styled(Box)({
  backgroundColor: "#d32f2f",
  height: 80,
  width: 20,
  margin: 0,
  padding: 0,
  position: "absolute",
  top: -12,
  left: 60,
  borderTopLeftRadius: 200,
  borderBottomLeftRadius: 50,
  borderBottomRightRadius: 50,
  zIndex: -1,
});

const WingBlack = styled(Box)({
  border: "10px solid #d32f2f",
  height: 60,
  width: 60,
  margin: 0,
  padding: 0,
  position: "absolute",
  top: -10,
  right: -50,
  borderRadius: 40,
  boxSizing: "border-box",
  "&:after": {
    content: '""',
    backgroundColor: "#d32f2f",
    height: 10,
    width: 40,
    margin: 0,
    padding: 0,
    position: "absolute",
    top: 15,
    left: 0,
  },
  "&:before": {
    content: '""',
    backgroundColor: "#d32f2f",
    height: 20,
    width: 20,
    margin: 0,
    padding: 0,
    position: "absolute",
    top: 10,
    left: 10,
    borderRadius: 20,
  },
});

const Flywing = styled(Box)({
  backgroundColor: "black",
  height: 10,
  width: 40,
  margin: 0,
  padding: 0,
  position: "relative",
  top: 15,
  left: 0,
  borderRadius: 40,
  transform: "rotate(50deg)",
  animation: `${bottomWingRotate} 0.5s linear 0.5s infinite`,
  "&:after": {
    content: '""',
    backgroundColor: "black",
    height: 10,
    width: 40,
    margin: 0,
    padding: 0,
    position: "absolute",
    top: 0,
    left: 0,
    borderRadius: 40,
    transform: "rotate(90deg)",
  },
});

const BottomStand = styled(Box)({
  backgroundColor: "black",
  height: 8,
  width: 130,
  margin: 0,
  padding: 0,
  position: "relative",
  top: 0,
  left: 50,
  borderBottomLeftRadius: 40,
  borderBottomRightRadius: 40,
  clear: "both",
  "&:after": {
    content: '""',
    backgroundColor: "black",
    height: 30,
    width: 8,
    margin: 0,
    padding: 0,
    position: "absolute",
    top: 0,
    right: 2,
    transform: "rotate(-10deg)",
  },
  "&:before": {
    content: '""',
    backgroundColor: "black",
    height: 30,
    width: 8,
    margin: 0,
    padding: 0,
    position: "absolute",
    top: 0,
    left: 2,
    transform: "rotate(10deg)",
  },
});

const BottomEnd = styled(Box)({
  backgroundColor: "black",
  height: 8,
  width: 175,
  margin: "20px 0 0 30px",
  padding: 0,
  borderBottomLeftRadius: 40,
  borderBottomRightRadius: 40,
});

const ModalBackground = styled(Box)({
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
});

const FlyingHelicopter = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <ModalBackground>
      <HelicopterContainer>
        <TopWing />
        <TopWingMiddle />
        <TopWingBottom />
        <FrontTop />
        <Front>
          <Glass />
          <Unglass />
        </Front>
        <Black>
          <Typography
            component="p"
            sx={{
              color: "white",
              fontFamily: "sans-serif",
              borderBottom: "4px double white",
              textAlign: "center",
              padding: "5px",
              margin: "5px 0 0 0",
              fontSize: "0.7em",
              boxSizing: "border-box",
            }}
          >
            Heliwise Leonardo Superpower
          </Typography>
          <Middle />
          <WingBlack>
            <Flywing />
          </WingBlack>
        </Black>
        <BottomStand />
        <BottomEnd />
      </HelicopterContainer>
    </ModalBackground>
  );
};

export default FlyingHelicopter;
