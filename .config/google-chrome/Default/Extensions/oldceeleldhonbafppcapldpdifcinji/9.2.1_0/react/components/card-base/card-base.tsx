import React, { useMemo, useRef, useState, useEffect, useImperativeHandle, useCallback, forwardRef } from "react";
import { createPortal } from "react-dom";
import type { ToolboxTextSelectionType } from "@advanced-toolbox/types";
import { i18nManager } from "../../../common/i18nManager";
import { classes, dispatchCustomEvent } from "../../../common/utils";
import { isFunction, isUndefined } from "../../../core/utils";
import KeyboardNavigation from "../keyboard-navigation/keyboard-navigation";
import KeyboardNavigationHint from "../keyboard-navigation-hint/keyboard-navigation-hint";
import useStopPropagation from "../../hooks/use-stop-propagation";
import { Div, Span, elementFactory, useI18nContext, useStorageContext } from "../../index";
import { useDraggable, BaseCardContextProvider } from "./hooks";
import type { CardMode, CardTriggerType } from "../../../ts-types/common";
import { TrackerAdapter } from "../../../common/trackerAdapter";
import { ToolboxEventNames } from "../toolbox-content/toolbox-content";
import ExtnConfig, { ConfigKey } from "../../../init/config";
import { EnvironmentAdapter } from "../../../common/environmentAdapter";
import { NavigationDirection } from "../editor-card/editor-card";

export type CardType = "wide" | "narrow";

export interface Props {
	root: HTMLElement;
	mode: CardMode | undefined;
	type: CardType;
	triggerType: CardTriggerType;
	isPremium: boolean;
	disablePremiumTeaser: boolean;
	className?: string;
	keyboardNavigationEnabled: boolean;
	keyboardEventTarget: Document;
	backdropRoot: HTMLElement;
	canChangeMode: boolean;
	canSeeLollipop: boolean;
	onModeChange?: {
		(mode: CardMode): void;
		(
			mode: "paraphrase",
			textHighlightType?: ToolboxTextSelectionType,
			triggerType?: CardTriggerType,
			requiresPositionUpdate?: boolean
		): void;
	};
	onNavigateSentence: (direction: NavigationDirection) => void;
	onClose: () => void;
	onPremiumClick?: (subject: "logo" | "badge") => void;
	onDetachCard: () => void;
	updatePosition?: (container: HTMLElement | null, keepCurrentPosition?: boolean) => void;
	getPositionMode: () => "below" | "above" | null;
	moveIntoViewport: (container: HTMLElement | null) => void;
	onForceCardOpenChange?: (toggle: boolean) => void;
	onSentenceHighlightChange?: (toggle: boolean) => void;
}

export interface CardBaseRef {
	updatePosition: () => void;
	updateCardType: (cardType: CardType) => void;
	updateCanChangeMode: (newValue: boolean) => void;
	updateSentenceNavigationVisibility: (show: boolean) => void;
}

type SelectorProps = Pick<Props, "mode" | "canSeeLollipop" | "onModeChange">;

interface SettingsSelectorProps {
	onDisableLollipopSelected: (e: Event) => void;
}

type TooltipPosition = { top: number } & ({ left: number } | { right: number });

const FEEDBACK_FORM_URL =
	"https://docs.google.com/forms/d/e/1FAIpQLSc-URuQ81hhAa8ti80CXIG_x-PSoNfcjOoqDyuJ8eOLtYzxIQ/viewform";

const FEEDBACK_FORM_QUERY_PARAM_VERSION = "entry.1107064358";

const FEEDBACK_POPUP_OPTIONS = {
	menubar: "no",
	statusbar: "no",
	width: "660",
	height: "690",
	left: "20",
	top: "20",
	noopener: "yes",
	noreferrer: "yes",
};

const extnPrefix = ExtnConfig.get(ConfigKey.EXTN_PREFIX);

const LtCompCardBase = elementFactory("comp-card-base");

const SettingsSelector: React.FC<SettingsSelectorProps> = ({ onDisableLollipopSelected }) => {
	const [menuVisible, setMenuVisible] = useState(false);
	const { current: i18n } = useRef<Record<"close" | "sendFeedback" | "disableLollipop" | "learnMore", string>>({
		close: i18nManager.getMessage("close"),
		sendFeedback: i18nManager.getMessage("sendFeedback"),
		disableLollipop: i18nManager.getMessage("disableLollipop"),
		learnMore: i18nManager.getMessage("toolboxOnboardingLearnMore"),
	});
	const { getSettings } = useStorageContext();
	const { hasLollipopEnabled } = getSettings();

	const toggleMenu = useStopPropagation(() => {
		setMenuVisible(!menuVisible);
		if (!menuVisible) {
			TrackerAdapter.trackEvent("Lollipop", "toolbox:open_kebab");
		}
	});
	const handleDisableLollipopClick = useStopPropagation((e) => {
		setMenuVisible(false);
		onDisableLollipopSelected?.(e);
	});
	const handleFeedbackClick = useStopPropagation(() => {
		const url = new URL(FEEDBACK_FORM_URL);
		const version = EnvironmentAdapter.getVersion();
		url.searchParams.set(FEEDBACK_FORM_QUERY_PARAM_VERSION, version);

		setMenuVisible(false);
		TrackerAdapter.trackEvent("Lollipop", "toolbox:open_feedback");
		self.open(
			url.toString(),
			"_blank",
			Object.entries(FEEDBACK_POPUP_OPTIONS)
				.map((o) => o.join("="))
				.join(",")
		);
	});
	const handleLearnMoreClick = useStopPropagation(() => {
		setMenuVisible(false);
		TrackerAdapter.trackEvent("Lollipop", "toolbox:learn_more");
		self.open(ExtnConfig.get(ConfigKey.LOLLIPOP_CONFIG).ONBOARDING_LANDING_PAGE_URL, "_blank");
	});
	const handleBackdropClick = useStopPropagation(() => {
		setMenuVisible(false);
	});

	return (
		<>
			<Div className="lt-comp-card-base__selector">
				<Div
					className="lt-comp-card-base__kebab-menu-icon lt-icon__kebab-menu"
					data-lt-testid="card-kebab-menu"
					onClick={toggleMenu}
				>
					<Span className="lt-comp-card-base__btn__label">{i18n.close}</Span>
				</Div>
				{menuVisible && (
					<Div className="lt-comp-card-base__selector__menu lt-comp-card-base__selector__menu--right">
						{hasLollipopEnabled && (
							<>
								<Div
									className="lt-comp-card-base__selector__menu-item lt-comp-card-base__selector__menu-item--learn-more"
									onClick={handleLearnMoreClick}
								>
									{i18n.learnMore}
								</Div>
								<Div
									className="lt-comp-card-base__selector__menu-item lt-comp-card-base__selector__menu-item--disable"
									onClick={handleDisableLollipopClick}
								>
									{i18n.disableLollipop}
								</Div>
							</>
						)}
						<Div
							className="lt-comp-card-base__selector__menu-item lt-comp-card-base__selector__menu-item--feedback"
							onClick={handleFeedbackClick}
						>
							{i18n.sendFeedback}
						</Div>
					</Div>
				)}
			</Div>
			{menuVisible && <Div className="lt-comp-card-base__selector-backdrop" onClick={handleBackdropClick} />}
		</>
	);
};

const Selector: React.FC<SelectorProps> = ({ mode, canSeeLollipop, onModeChange }) => {
	const { hasRephrasingEnabled } = useStorageContext();
	const [menuVisible, setMenuVisible] = useState(false);
	const { current: i18n } = useRef<Record<"paraphraser" | "checker" | "toolbox", string>>({
		paraphraser: i18nManager.getMessage("cardSelectorLabelParaphraser"),
		checker: i18nManager.getMessage("cardSelectorLabelChecker"),
		toolbox: i18nManager.getMessage("cardSelectorLabelAITools"),
	});
	const caption = useMemo(() => {
		switch (mode) {
			case "correct":
				return i18n.checker;
			case "paraphrase":
				return i18n.paraphraser;
			case "toolbox":
				return i18n.toolbox;
			default:
				throw new Error(`Unexpected mode "${mode}"`);
		}
	}, [mode]);
	const toggleMenu = useStopPropagation(() => setMenuVisible(menuVisible ? false : true));
	const selectParaphrase = useStopPropagation(() => {
		setMenuVisible(false);
		onModeChange?.("paraphrase");
	});
	const selectCorrect = useStopPropagation(() => {
		setMenuVisible(false);
		onModeChange?.("correct");
	});
	const selectToolbox = useStopPropagation(() => {
		setMenuVisible(false);
		onModeChange?.("toolbox");
	});
	const handleBackdropClick = useStopPropagation(() => {
		setMenuVisible(false);
	});
	type SelectorItem = {
		name: CardMode;
		caption: string;
		handleClick: (e: Event) => void;
	};
	const items = useMemo<SelectorItem[]>(() => {
		const items: SelectorItem[] = [
			{
				name: "correct",
				caption: i18n.checker,
				handleClick: selectCorrect,
			},
		];

		if (canSeeLollipop) {
			items.push({
				name: "toolbox",
				caption: i18n.toolbox,
				handleClick: selectToolbox,
			});
		} else {
			items.push({
				name: "paraphrase",
				caption: i18n.paraphraser,
				handleClick: selectParaphrase,
			});
		}

		return items.sort(({ name }) => (name === mode ? -1 : 1));
	}, [mode, canSeeLollipop, selectParaphrase, selectCorrect, selectToolbox]);

	return (
		<>
			<Div className="lt-comp-card-base__selector">
				<Div
					className={classes(
						"lt-comp-card-base__selector__label",
						menuVisible && "lt-comp-card-base__selector__label--active",
						!hasRephrasingEnabled() && "lt-comp-card-base__selector__label--disabled"
					)}
					onClick={hasRephrasingEnabled() ? toggleMenu : undefined}
				>
					{caption}
				</Div>
				{menuVisible && (
					<Div className="lt-comp-card-base__selector__menu">
						{items.map(({ name, caption, handleClick }) => (
							<Div
								key={name}
								className={classes(
									"lt-comp-card-base__selector__menu-item",
									"lt-comp-card-base__selector__menu-item--" + name,
									mode === name && "lt-comp-card-base__selector__menu-item--current"
								)}
								onClick={handleClick}
							>
								{caption}
							</Div>
						))}
					</Div>
				)}
			</Div>
			{menuVisible && <Div className="lt-comp-card-base__selector-backdrop" onClick={handleBackdropClick} />}
		</>
	);
};

const DragHandleBase: React.ForwardRefRenderFunction<HTMLElement> = (_, ref) => {
	return (
		<Div className="lt-comp-card-base__draggable">
			<Div className="lt-comp-card-base__draggable__handle" ref={ref}>
				{/* @see src/assets/images/card-drag-handle.svg */}
				<svg
					width="20"
					height="8"
					viewBox="0 0 20 8"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className="lt-comp-card-base__draggable__handle__graphic"
				>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M1.6 3.2C2.48366 3.2 3.2 2.48366 3.2 1.6C3.2 0.716344 2.48366 0 1.6 0C0.716344 0 0 0.716344 0 1.6C0 2.48366 0.716344 3.2 1.6 3.2ZM7.2 3.2C8.08366 3.2 8.8 2.48366 8.8 1.6C8.8 0.716344 8.08366 0 7.2 0C6.31634 0 5.6 0.716344 5.6 1.6C5.6 2.48366 6.31634 3.2 7.2 3.2ZM14.4 1.6C14.4 2.48366 13.6837 3.2 12.8 3.2C11.9163 3.2 11.2 2.48366 11.2 1.6C11.2 0.716344 11.9163 0 12.8 0C13.6837 0 14.4 0.716344 14.4 1.6ZM18.4 3.2C19.2837 3.2 20 2.48366 20 1.6C20 0.716344 19.2837 0 18.4 0C17.5163 0 16.8 0.716344 16.8 1.6C16.8 2.48366 17.5163 3.2 18.4 3.2ZM3.2 6.4C3.2 7.28366 2.48366 8 1.6 8C0.716344 8 0 7.28366 0 6.4C0 5.51634 0.716344 4.8 1.6 4.8C2.48366 4.8 3.2 5.51634 3.2 6.4ZM7.2 8C8.08366 8 8.8 7.28366 8.8 6.4C8.8 5.51634 8.08366 4.8 7.2 4.8C6.31634 4.8 5.6 5.51634 5.6 6.4C5.6 7.28366 6.31634 8 7.2 8ZM14.4 6.4C14.4 7.28366 13.6837 8 12.8 8C11.9163 8 11.2 7.28366 11.2 6.4C11.2 5.51634 11.9163 4.8 12.8 4.8C13.6837 4.8 14.4 5.51634 14.4 6.4ZM18.4 8C19.2837 8 20 7.28366 20 6.4C20 5.51634 19.2837 4.8 18.4 4.8C17.5163 4.8 16.8 5.51634 16.8 6.4C16.8 7.28366 17.5163 8 18.4 8Z"
						fill="currentColor"
					/>
				</svg>
			</Div>
		</Div>
	);
};
const DragHandle = forwardRef(DragHandleBase);

const CardBase = forwardRef<CardBaseRef, React.PropsWithChildren<Props>>(function CardBase(
	{
		canChangeMode: initialCanChangeMode,
		root,
		mode,
		type,
		isPremium,
		disablePremiumTeaser,
		className,
		keyboardNavigationEnabled,
		keyboardEventTarget,
		backdropRoot,
		canSeeLollipop,
		onModeChange,
		onClose,
		onPremiumClick,
		onDetachCard,
		updatePosition,
		moveIntoViewport,
		onNavigateSentence,
		children,
	},
	ref
) {
	const getMessage = useI18nContext();
	const storageController = useStorageContext();
	const { current: i18n } = useRef<Record<"close" | "toolbox", string>>({
		close: getMessage("close"),
		toolbox: getMessage("cardSelectorLabelAITools"),
	});
	const cardBaseRef = useRef<HTMLElement>(null);
	const arrowLeftRef = useRef<HTMLElement>(null);
	const arrowRightRef = useRef<HTMLElement>(null);
	const dragHandleRef = useRef<HTMLElement>(null);
	const outerCardElem = cardBaseRef.current?.parentElement;
	const [cardType, setCardType] = useState<CardType>(type);
	const [canChangeMode, setCanChangeMode] = useState(initialCanChangeMode);
	const [arrowTooltipLeftPosition, setArrowTooltipLeftPosition] = useState<TooltipPosition>({ top: -1, left: -1 });
	const [arrowTooltipLeftVisible, setArrowTooltipLeftVisible] = useState(false);
	const [arrowTooltipRightPosition, setArrowTooltipRightPosition] = useState<TooltipPosition>({ top: -1, right: -1 });
	const [arrowTooltipRightVisible, setArrowTooltipRightVisible] = useState(false);
	const [showSentenceNavigation, setShowSentenceNavigation] = useState<boolean>(false);
	const handleModeChange = useMemo(
		() => (isFunction(onModeChange) ? (newMode: CardMode) => onModeChange?.(newMode) : undefined),
		[onModeChange]
	);
	const showModeSelector = useMemo(
		() => canChangeMode && isFunction(handleModeChange),
		[canChangeMode, handleModeChange]
	);
	const togglePrevious = useCallback(() => {
		if (mode === "toolbox") {
			onNavigateSentence("previous");
			TrackerAdapter.trackEvent("Lollipop", "toolbox:previous_sentence");
		} else {
			throw new Error(`Sentence navigation feature unhandled for mode "${mode}"`);
		}
	}, [mode, onNavigateSentence]);

	const toggleNext = useCallback(() => {
		if (mode === "toolbox") {
			onNavigateSentence("next");
			TrackerAdapter.trackEvent("Lollipop", "toolbox:next_sentence");
		} else {
			throw new Error(`Sentence navigation feature unhandled for mode "${mode}"`);
		}
	}, [mode, onNavigateSentence]);
	const cardCaption = useMemo(() => (mode === "toolbox" ? i18n.toolbox : "LanguageTool"), [mode]);
	const [draggableState, { adjustPosition: adjustDraggableCardPosition, destroyDomMeasurementCache }] = useDraggable(
		cardBaseRef.current,
		dragHandleRef.current,
		backdropRoot
	);
	const updateCardPosition = useCallback(
		() => updatePosition?.(cardBaseRef.current, draggableState.isDetached),
		[updatePosition, draggableState.isDetached]
	);
	const moveCardIntoViewport = useCallback(() => {
		moveIntoViewport(cardBaseRef.current);
		destroyDomMeasurementCache();
	}, [moveIntoViewport, destroyDomMeasurementCache]);
	const shouldUpsell = isPremium === false && disablePremiumTeaser !== true;
	const handleClose = useStopPropagation(() => {
		onClose();
		TrackerAdapter.trackEvent("Lollipop", "toolbox:closeCross");
	});
	const handleLogoClick = useStopPropagation(() => {
		onPremiumClick?.("logo");
	});
	const handleBadgeClick = useStopPropagation(() => {
		onPremiumClick?.("badge");
	});
	const handleDisableLollipopSettingsOptionClick = useStopPropagation(() => {
		storageController.updateSettings({
			hasLollipopEnabled: false,
		});

		TrackerAdapter.trackEvent("Lollipop", "disable_lollipop:toolbox");

		dispatchCustomEvent(document, ToolboxEventNames.turnOffLollipop);

		onClose();
	});
	const createTooltipInlineStyles = (o: TooltipPosition) => {
		type CustomVar =
			| `--${typeof extnPrefix}-tooltip-offset-${keyof TooltipPosition}`
			| `--${typeof extnPrefix}-tooltip-left-opacity`
			| `--${typeof extnPrefix}-tooltip-right-opacity`;

		const customVars: Record<CustomVar, string> = {
			[`--${extnPrefix}-tooltip-left-opacity`]: arrowTooltipLeftVisible ? "1" : "0",
			[`--${extnPrefix}-tooltip-right-opacity`]: arrowTooltipRightVisible ? "1" : "0",
		};

		for (const k of Object.keys(o)) {
			if (o[k] > -1) {
				customVars[`--${extnPrefix}-tooltip-offset-${k}`] = o[k] + "px";
			}
		}

		return customVars;
	};

	useImperativeHandle<object, CardBaseRef>(
		ref,
		() => ({
			updatePosition: updateCardPosition,
			updateCardType: setCardType,
			updateCanChangeMode: setCanChangeMode,
			updateSentenceNavigationVisibility: setShowSentenceNavigation,
		}),
		[updateCardPosition]
	);

	useEffect(() => {
		if (draggableState.isDetached) {
			onDetachCard();
		}
	}, [draggableState.isDetached, onDetachCard]);

	useEffect(() => {
		if (arrowLeftRef.current) {
			const { left: offsetLeft, top: offsetTop, width, height } = arrowLeftRef.current.getBoundingClientRect();
			const { offsetWidth: windowWidth } = arrowLeftRef.current.ownerDocument.documentElement;
			const right = windowWidth - offsetLeft - width;
			const top = offsetTop + height;

			setArrowTooltipLeftPosition({ top, right });
		}

		if (arrowRightRef.current) {
			const { left: offsetLeft, top: offsetTop, height } = arrowRightRef.current.getBoundingClientRect();
			const left = offsetLeft;
			const top = offsetTop + height;

			setArrowTooltipRightPosition({ top, left });
		}
	}, [showSentenceNavigation]);

	if (isUndefined(mode)) {
		return (
			<LtCompCardBase
				className={classes("notranslate", className, "lt-comp-card-base--narrow")}
				data-lt-testid="card-container"
				ref={cardBaseRef}
			>
				<Div className="lt-comp-card-base__header">
					<Div className="lt-comp-card-base__header__left">
						<Div className="lt-comp-card-base__logo" />
						<Div className="lt-comp-card-base__caption">LanguageTool</Div>
					</Div>
				</Div>
				{children}
			</LtCompCardBase>
		);
	}

	return (
		<KeyboardNavigation
			enableKeyboard={keyboardNavigationEnabled}
			keyboardEventTarget={keyboardEventTarget}
			root={root}
			mode={mode}
			onClose={onClose}
		>
			<BaseCardContextProvider
				value={{
					isDetached: draggableState.isDetached,
					adjustPosition: adjustDraggableCardPosition,
					updateCardPosition,
					moveCardIntoViewport,
				}}
			>
				<LtCompCardBase
					className={classes(
						"notranslate",
						className,
						draggableState.isDraggable && "lt-comp-card-base--draggable",
						draggableState.isDragging && "lt-comp-card-base--dragging",
						draggableState.isDetached && "lt-comp-card-base--detached",
						draggableState.isInSnapProximity && "lt-comp-card-base--in-snap-proximity",
						draggableState.isResetting && "lt-comp-card-base--resetting",
						cardType === "wide" && "lt-comp-card-base--wide",
						cardType === "narrow" && "lt-comp-card-base--narrow"
					)}
					data-lt-testid="card-container"
					ref={cardBaseRef}
				>
					<DragHandle ref={dragHandleRef} />
					<Div className="lt-comp-card-base__header">
						<Div className="lt-comp-card-base__header__left">
							<Div
								className={classes(
									"lt-comp-card-base__logo",
									shouldUpsell && "lt-comp-card-base__logo--clickable"
								)}
								onClick={shouldUpsell ? handleLogoClick : undefined}
							/>
							{showModeSelector ? (
								<Selector mode={mode} canSeeLollipop={canSeeLollipop} onModeChange={handleModeChange} />
							) : (
								<Div className="lt-comp-card-base__caption">{cardCaption}</Div>
							)}
						</Div>
						<Div className="lt-comp-card-base__header__right">
							{mode === "toolbox" && (
								<>
									{showSentenceNavigation && (
										<>
											<Div
												className="lt-comp-card-base__btn lt-icon__arrow_left"
												onClick={togglePrevious}
												onMouseOver={() => setArrowTooltipLeftVisible(true)}
												onMouseOut={() => setArrowTooltipLeftVisible(false)}
												ref={arrowLeftRef}
												data-lt-testid="previous-sentence"
											>
												{outerCardElem &&
													createPortal(
														<Span
															className="lt-comp-card-base__btn-tooltip lt-comp-card-base__btn-tooltip--left"
															style={createTooltipInlineStyles(arrowTooltipLeftPosition)}
														>
															{getMessage("editorCardPreviousSentence")}
														</Span>,
														outerCardElem
													)}
											</Div>
											<Div
												className="lt-comp-card-base__btn lt-icon__arrow_right"
												onClick={toggleNext}
												onMouseOver={() => setArrowTooltipRightVisible(true)}
												onMouseOut={() => setArrowTooltipRightVisible(false)}
												ref={arrowRightRef}
												data-lt-testid="next-sentence"
											>
												{outerCardElem &&
													createPortal(
														<Span
															className="lt-comp-card-base__btn-tooltip lt-comp-card-base__btn-tooltip--right"
															style={createTooltipInlineStyles(arrowTooltipRightPosition)}
														>
															{getMessage("editorCardNextSentence")}
														</Span>,
														outerCardElem
													)}
											</Div>
										</>
									)}
									<SettingsSelector
										onDisableLollipopSelected={handleDisableLollipopSettingsOptionClick}
									/>
								</>
							)}
							{shouldUpsell && (
								<Span
									className="lt-comp-card-base__badge"
									data-lt-testid="badge-basic"
									onClick={handleBadgeClick}
								>
									Basic
								</Span>
							)}
							<Div
								className="lt-comp-card-base__btn lt-icon__close_small"
								onClick={handleClose}
								data-lt-testid="card-close"
							>
								<Span className="lt-comp-card-base__btn__label">{i18n.close}</Span>
							</Div>
						</Div>
					</Div>
					{keyboardNavigationEnabled && mode !== "toolbox" && (
						<KeyboardNavigationHint className="lt-comp-editor-card__keyboard-hint" />
					)}
					{children}
				</LtCompCardBase>
			</BaseCardContextProvider>
		</KeyboardNavigation>
	);
});

export default CardBase;
