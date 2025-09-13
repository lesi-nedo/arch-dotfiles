import React, { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { elementFactory } from "../../index";
import { classes } from "../../../common/utils";
import ExtnConfig, { ConfigKey } from "../../../init/config";

export type CardType = "wide" | "narrow";

export interface CustomCardBaseProps extends React.ComponentProps<ReturnType<typeof elementFactory>> {
	updatePosition?: (container: HTMLElement | null) => void;
	isHidden?: boolean;
}

export interface CardBaseRef {
	updatePosition: () => void;
	updateCardType: (cardType: CardType) => void;
	updateCanChangeMode: (newValue: boolean) => void;
	updateSentenceNavigationVisibility: (show: boolean) => void;
}

const LtCompCardBase = elementFactory("comp-card-base");

const CustomCardBase = forwardRef<CardBaseRef, React.PropsWithChildren<CustomCardBaseProps>>(function CardBase(
	{ updatePosition, children, isHidden, ...containerProps },
	ref
) {
	const extnPrefix = ExtnConfig.get(ConfigKey.EXTN_PREFIX);
	const cardBaseRef = useRef<HTMLElement>(null);

	const updateCardPosition = useCallback(() => {
		updatePosition?.(cardBaseRef.current);
	}, [updatePosition]);

	const updateSentenceNavigationVisibility = useCallback(
		(isVisible: boolean) => {
			cardBaseRef.current?.style.setProperty(
				`--${extnPrefix}-comp-card-base-toolbox-sentence-navigation-display`,
				isVisible ? "" : "none"
			);
		},
		[extnPrefix]
	);
	useImperativeHandle<object, CardBaseRef>(
		ref,
		() => ({
			updatePosition: updateCardPosition,
			updateCardType: () => undefined,
			updateCanChangeMode: () => undefined,
			updateSentenceNavigationVisibility,
		}),
		[updateCardPosition, updateSentenceNavigationVisibility]
	);

	return (
		<LtCompCardBase
			{...containerProps}
			ref={cardBaseRef}
			className={classes(containerProps.className, isHidden && `${extnPrefix}-comp-card-base--hidden`)}
		>
			{children}
		</LtCompCardBase>
	);
});

export default CustomCardBase;
