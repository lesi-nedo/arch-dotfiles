import React, { useState, useEffect, useRef, useCallback, useMemo, forwardRef } from "react";
import type { ForwardRefExoticComponent, ForwardedRef } from "react";
import CardBase, { type CardBaseRef, type Props as CardBaseProps, type CardType } from "../card-base/card-base";
import ErrorContent, { type Props as ErrorContentProps, isErrorContentProps } from "../error-content/error-content";
import RephraseContent, {
	type Props as RephraseContentProps,
	isRephraseContentProps,
} from "../rephrase-content/rephrase-content";
import ToolboxContent, {
	type Props as ToolboxContentProps,
	isToolboxContentProps,
} from "../toolbox-content/toolbox-content";
import LoadingContent from "../loading-content/loading-content";
import ScrollableArea from "../scrollable-area/scrollable-area";
import { EditorCardContextProvider } from "./context";
import LTReact, { Div, Span } from "../../index";
import { useBaseCardContext } from "../card-base/hooks";
import { classes } from "../../../common/utils";
import { TrackerAdapter } from "../../../common/trackerAdapter";
import type { CardMode } from "../../../ts-types/common";
import type { SelectionInfo } from "../../../content/inputAreaWrapper";
import type { CustomCardBaseProps } from "../card-base/custom-card-base";
import type { ToolboxTextContext } from "@advanced-toolbox/types";

export type NavigationDirection = "previous" | "next";

export interface FooterProps {
	mode: CardMode | undefined;
	isIdle: boolean;
	userCanNavigate: boolean;
	disableNavigatePrevBtn: boolean;
	disableNavigateNextBtn: boolean;
	onNavigateError: (direction: NavigationDirection) => void;
	onNavigateSentence: (direction: NavigationDirection) => void;
}

type ContentPropsMap = { paraphrase: RephraseContentProps; correct: ErrorContentProps; toolbox: ToolboxContentProps };

export type UsePropsByModeFn<R = void> = <T extends CardMode>(
	previousMode: CardMode | undefined,
	mode: T | undefined,
	props: (T extends keyof ContentPropsMap ? ContentPropsMap[T] : never) | null
) => R;

export type RetrieveUpdateContentFn = (fn: UsePropsByModeFn) => void;

export type UpdateTextContextFn = (t: ToolboxTextContext) => void;

export type SetCardIdleFn = (t: boolean) => void;

export type InitialContentProps = RephraseContentProps | ErrorContentProps | ToolboxContentProps | null;

export type CustomCardProps = {
	initialContentProps: InitialContentProps;
	mode: CardMode | undefined;
	root: HTMLElement;
	forwardUpdateContentFn: RetrieveUpdateContentFn;
	forwardUpdateTextContextFn: (fn: UpdateTextContextFn) => void;
	forwardSetCardIdleFn: (fn: SetCardIdleFn) => void;
	cardBaseRef: ForwardedRef<CardBaseRef>;
	cardBaseProps: {
		type: CardType;
		isPremium: boolean;
		disablePremiumTeaser: boolean;
		className?: string | undefined;
		keyboardNavigationEnabled: boolean;
		keyboardEventTarget: Document;
		onNavigateSentence: (direction: NavigationDirection) => void;
	};
	setCustomBaseCardProps?: (props: CustomCardBaseProps) => void;
};

export type CustomEditorCardType = ForwardRefExoticComponent<Props> & {
	render?: (props: CustomCardProps) => JSX.Element;
};

export type Props = CardBaseProps &
	Omit<FooterProps, "mode" | "userCanNavigate" | "isIdle" | "disableNavigatePrevBtn" | "disableNavigateNextBtn"> & {
		initialContentProps: InitialContentProps;
		forwardUpdateContentFn: RetrieveUpdateContentFn;
		forwardUpdateTextContextFn: (fn: UpdateTextContextFn) => void;
		forwardSetCardIdleFn: (fn: SetCardIdleFn) => void;
		customEditorCard?: CustomEditorCardType;
		selectionInfo?: SelectionInfo;
	};

const useGetContent: UsePropsByModeFn<React.ReactElement | null> = (previousMode, mode, props) => {
	const getComponent = useCallback(() => {
		if (props === null) {
			return <LoadingContent />;
		} else if (mode === "paraphrase" && isRephraseContentProps(props)) {
			if (previousMode === "correct" && props.synonymsData) {
				props.synonymsData.wordIsErroneous = true;
			}

			return <RephraseContent {...props} />;
		} else if (mode === "correct" && isErrorContentProps(props)) {
			return <ErrorContent {...props} />;
		} else if (mode === "toolbox" && isToolboxContentProps(props)) {
			return <ToolboxContent {...props} />;
		} else {
			throw new Error(`Invalid card mode "${mode}" passed in`);
		}
	}, [previousMode, mode, props]);
	const [currentContent, setCurrentContent] = useState<React.ReactElement | null>(getComponent());

	useEffect(() => {
		setCurrentContent(getComponent());
	}, [getComponent]);

	return currentContent;
};

const Footer: React.FC<FooterProps> = ({
	mode,
	isIdle,
	userCanNavigate,
	disableNavigatePrevBtn,
	disableNavigateNextBtn,
	onNavigateError,
	onNavigateSentence,
}) => {
	const { isDetached, adjustPosition } = useBaseCardContext();
	const previousIsDetached = useRef<boolean | null>(null);
	const togglePrevious = useCallback(() => {
		if (disableNavigatePrevBtn) {
			return;
		}

		switch (mode) {
			case "correct":
				onNavigateError("previous");
				TrackerAdapter.trackEvent("Action", "editor_card:previous_error");
				break;
			case "paraphrase":
				onNavigateSentence("previous");
				TrackerAdapter.trackEvent("Action", "editor_card:previous_sentence");
				break;
			default:
				throw new Error(`Unknown mode "${mode}"`);
		}
	}, [mode, disableNavigatePrevBtn, onNavigateError, onNavigateSentence]);
	const toggleNext = useCallback(() => {
		if (disableNavigateNextBtn) {
			return;
		}

		switch (mode) {
			case "correct":
				onNavigateError("next");
				TrackerAdapter.trackEvent("Action", "editor_card:next_error");
				break;
			case "paraphrase":
				onNavigateSentence("next");
				TrackerAdapter.trackEvent("Action", "editor_card:next_sentence");
				break;
			default:
				throw new Error(`Unknown mode "${mode}"`);
		}
	}, [mode, disableNavigateNextBtn, onNavigateError, onNavigateSentence]);
	const translationKey = useMemo(
		() => (mode === "correct" ? "editorCardNextIssue" : "editorCardNextSentence"),
		[mode]
	);

	useEffect(() => {
		if (previousIsDetached.current === false && isDetached === true) {
			// Card got detached. Adjust position to componsate
			// for the appearing card navigation...
			adjustPosition();
		}

		previousIsDetached.current = isDetached;
	}, [isDetached, adjustPosition]);

	if (!isDetached || !userCanNavigate || !mode) {
		return null;
	}

	return (
		<Div className="lt-comp-editor-base__footer">
			<>
				<Div
					className={classes(
						"lt-comp-editor-base__footer__btn lt-comp-editor-base__footer__btn--prev",
						isIdle && "lt-comp-editor-base__footer__btn--idle",
						disableNavigatePrevBtn && "lt-comp-editor-base__footer__btn--disable"
					)}
					onClick={togglePrevious}
					data-lt-testid="previous-issue"
				>
					<Span className="lt-comp-editor-base__footer__icon lt-icon__arrow_left--blue" />
				</Div>
				<Div
					className={classes(
						"lt-comp-editor-base__footer__btn lt-comp-editor-base__footer__btn--next",
						isIdle && "lt-comp-editor-base__footer__btn--idle",
						disableNavigateNextBtn && "lt-comp-editor-base__footer__btn--disable"
					)}
					onClick={toggleNext}
					data-lt-testid="next-issue"
				>
					<LTReact.Tr name={translationKey} />
					<Span className="lt-comp-editor-base__footer__icon lt-icon__arrow_right--blue" />
				</Div>
			</>
		</Div>
	);
};

const EditorCard = forwardRef<CardBaseRef, Props>(function EditorCard(
	{
		initialContentProps,
		mode,
		root,
		forwardUpdateContentFn,
		forwardUpdateTextContextFn,
		forwardSetCardIdleFn,
		...cardBaseProps
	},
	cardBaseRef
) {
	const [contentProps, setContentProps] = useState<InitialContentProps>(initialContentProps);
	const [previousMode, setPreviousMode] = useState<CardMode | undefined>();
	const [currentMode, setCurrentMode] = useState<CardMode | undefined>(mode);
	const { current: updateContent } = useRef<UsePropsByModeFn>((previousMode, mode, props) => {
		setPreviousMode(previousMode);
		setCurrentMode(mode);
		setContentProps(props);
	});
	const updateTextContext = useCallback(
		(newTextContext: ToolboxTextContext) => {
			if (isToolboxContentProps(contentProps)) {
				setContentProps({ ...contentProps, textContext: newTextContext });
			}
		},
		[contentProps]
	);

	const setCardIdle = useCallback(
		(flag: boolean) => {
			if (isToolboxContentProps(contentProps) || isErrorContentProps(contentProps)) {
				setContentProps({ ...contentProps, isIdle: flag });
			} else if (isRephraseContentProps(contentProps) && contentProps.paraphrasingsData) {
				setContentProps({
					...contentProps,
					paraphrasingsData: { ...contentProps.paraphrasingsData, isIdle: flag },
				});
			}
		},
		[contentProps]
	);

	const content = useGetContent(previousMode, currentMode, contentProps);
	const userCanNavigate = useMemo(() => {
		if (isErrorContentProps(contentProps)) {
			return contentProps.displayedErrors.length > 1;
		}

		if (isRephraseContentProps(contentProps)) {
			return !!contentProps.paraphrasingsData && Number(contentProps.sentenceRanges?.length) > 1;
		}

		return false;
	}, [contentProps]);

	const disableNavigateBtn = useMemo(() => {
		if (isErrorContentProps(contentProps) && !contentProps.allowCyclicNavigation) {
			const currentErrorId = contentProps.error?.id;

			if (!currentErrorId) {
				return { prev: false, next: false };
			}

			const errors = contentProps.displayedErrors;
			const isFirstError = errors[0].id === currentErrorId;
			const isLastError = errors[errors.length - 1].id === currentErrorId;

			return {
				prev: isFirstError,
				next: isLastError,
			};
		}

		return { prev: false, next: false };
	}, [contentProps]);

	const disableNavigatePrevBtn = disableNavigateBtn.prev;
	const disableNavigateNextBtn = disableNavigateBtn.next;

	const isIdle = useMemo(() => {
		if (isToolboxContentProps(contentProps) || isToolboxContentProps(contentProps)) {
			return contentProps.isIdle === true;
		}

		if (isRephraseContentProps(contentProps)) {
			return contentProps.paraphrasingsData?.isIdle === true;
		}

		return false;
	}, [contentProps]);

	useEffect(() => {
		forwardUpdateContentFn(updateContent);
	}, [forwardUpdateContentFn, updateContent]);

	useEffect(() => {
		forwardUpdateTextContextFn(updateTextContext);
	}, [forwardUpdateTextContextFn, updateTextContext]);

	useEffect(() => {
		forwardSetCardIdleFn(setCardIdle);
	}, [forwardSetCardIdleFn, setCardIdle]);

	return (
		<EditorCardContextProvider
			value={{ disablePremiumTeaser: cardBaseProps.disablePremiumTeaser, isLoading: contentProps === null }}
		>
			<CardBase {...cardBaseProps} mode={currentMode} ref={cardBaseRef} root={root}>
				<ScrollableArea scrollerClassName="lt-comp-editor-card__content">{content}</ScrollableArea>
				<Footer
					mode={currentMode}
					isIdle={isIdle}
					userCanNavigate={userCanNavigate}
					disableNavigatePrevBtn={disableNavigatePrevBtn}
					disableNavigateNextBtn={disableNavigateNextBtn}
					onNavigateError={cardBaseProps.onNavigateError}
					onNavigateSentence={cardBaseProps.onNavigateSentence}
				/>
			</CardBase>
		</EditorCardContextProvider>
	);
});

export default EditorCard;
