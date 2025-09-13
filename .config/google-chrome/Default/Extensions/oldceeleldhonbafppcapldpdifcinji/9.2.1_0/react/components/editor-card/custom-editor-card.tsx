import React, { forwardRef, useState } from "react";
import { Props } from "./editor-card";
import CustomCardBase, { CardBaseRef } from "../card-base/custom-card-base";
import type { CustomCardBaseProps } from "../card-base/custom-card-base";

const CustomEditorCard = forwardRef<CardBaseRef, Props>(function EditorCard(
	{
		initialContentProps,
		root,
		forwardUpdateContentFn,
		forwardUpdateTextContextFn,
		forwardSetCardIdleFn,
		customEditorCard,
		...cardBaseProps
	},
	cardBaseRef
) {
	const [customProps, setCustomProps] = useState<CustomCardBaseProps>({ className: "" });

	const setCustomBaseCardProps = (props: CustomCardBaseProps) => {
		setCustomProps(props);
	};

	return (
		<CustomCardBase {...cardBaseProps} {...customProps} ref={cardBaseRef}>
			{customEditorCard?.render?.({
				initialContentProps,
				mode: cardBaseProps.mode,
				root,
				forwardUpdateContentFn,
				forwardUpdateTextContextFn,
				forwardSetCardIdleFn,
				cardBaseProps,
				cardBaseRef,
				setCustomBaseCardProps,
			})}
		</CustomCardBase>
	);
});

export default CustomEditorCard;
