import React, { useEffect, useRef, useState } from "react";
import { Div, useI18nContext } from "../../index";
import { useBaseCardContext } from "../card-base/hooks";
import CardContent from "../card-content/card-content";
import { classes } from "../../../common/utils";

const LoadingContent: React.FC = () => {
	const getMessage = useI18nContext();
	const { updateCardPosition } = useBaseCardContext();
	const [isHintVisible, setIsHintVisible] = useState(false);
	const { current: i18n } = useRef<Record<"cardMessageLoadingTimeCaption" | "cardMessageLoadingTimeText", string>>({
		cardMessageLoadingTimeCaption: getMessage("cardMessageLoadingTimeCaption"),
		cardMessageLoadingTimeText: getMessage("cardMessageLoadingTimeText"),
	});

	useEffect(() => {
		const timeoutId = self.setTimeout(() => setIsHintVisible(true), 10_000);

		return () => clearTimeout(timeoutId);
	}, []);

	useEffect(updateCardPosition, [updateCardPosition]);

	return (
		<CardContent>
			<Div
				className={classes("lt-comp-loading-content", isHintVisible && "lt-comp-loading-content--has-message")}
			>
				{!isHintVisible && <Div className="lt-comp-loading-content__spinner lt-icon__loading" />}
				{isHintVisible && (
					<Div>
						<Div className="lt-comp-loading-content__caption">{i18n.cardMessageLoadingTimeCaption}</Div>
						<Div className="lt-comp-loading-content__text">{i18n.cardMessageLoadingTimeText}</Div>
					</Div>
				)}
			</Div>
		</CardContent>
	);
};

export default LoadingContent;
