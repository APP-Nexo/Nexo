import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, PressableProps } from 'react-native';
import { COLORS, FONT } from '../constants';

type ButtonProps = {
	children: React.ReactNode;
	style?: ViewStyle;
	textStyle?: TextStyle;
} & PressableProps;

export default function Button({ children, style, textStyle, ...props }: ButtonProps) {
	return (
		<Pressable style={({ pressed }) => [styles.button, style, pressed && styles.pressed]} {...props}>
			<Text style={[styles.text, textStyle]}>{children}</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		height: 54,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: COLORS.primary,
		backgroundColor: '#04141A',
		alignItems: 'center',
		justifyContent: 'center',
	},
	pressed: {
		opacity: 0.7,
	},
	text: {
		color: COLORS.primary,
		fontSize: FONT.text,
		fontWeight: '700',
		letterSpacing: 1,
	},
});