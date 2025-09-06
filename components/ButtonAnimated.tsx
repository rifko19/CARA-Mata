
import React, { useEffect, useState } from 'react';
import { Animated } from 'react-native';

const ButtonAnimated = ({
    children,
    scaleValue = 1.05,
    fadeDuration = 500,
    scaleFriction = 3,
    }: {
    children: React.ReactNode;
    scaleValue?: number;
    fadeDuration?: number;
    scaleFriction?: number;
    }) => {
    const [scale] = useState(new Animated.Value(1));
    const [fade] = useState(new Animated.Value(0));

    useEffect(() => {

        Animated.timing(fade, {
        toValue: 1,
        duration: fadeDuration,
        useNativeDriver: true,
        }).start();

        Animated.spring(scale, {
        toValue: scaleValue,
        friction: scaleFriction,
        useNativeDriver: true,
        }).start();
    }, [fadeDuration, scaleValue, scaleFriction]);

    return (
        <Animated.View
        style={{
            transform: [{ scale }],
            opacity: fade,
        }}
        >
        {children}
        </Animated.View>
    );
    };

export default ButtonAnimated;
