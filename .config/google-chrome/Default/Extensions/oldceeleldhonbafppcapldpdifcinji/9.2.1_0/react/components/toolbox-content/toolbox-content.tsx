import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	ToolboxAdapterIframeHost,
	type ToolboxAdapterIframeHostInitConfig,
} from "@advanced-toolbox/adapters/iframe/host";
import type { ToolboxExternalRenderOptions } from "@advanced-toolbox/adapters";
import type {
	ColorScheme,
	ToolboxApplyEvent,
	ToolboxEnvironment,
	ToolboxMonitoringEvent,
	ToolboxTextContext,
	ToolboxTextSelectionType,
	ToolboxTheme,
	ToolboxUiLanguage,
	ToolboxUserContext,
} from "@advanced-toolbox/types";
import { isObject } from "@advanced-toolbox/utils";
import type { ToolboxHostContext } from "../../../common/initialize-toolbox-iframe";
import { elementFactory } from "../../index";
import { classes } from "../../../common/utils";
import { ConfigKey, ExtnConfig } from "../../../init/config";
import { TrackerAdapter } from "../../../common/trackerAdapter";
import { EnvironmentAdapter } from "../../../common/environmentAdapter";
import type { DetectedSentenceLanguage, SentenceRange } from "../../../core/Checker";
import type { LollipopTriggerType } from "../../../lollipop/Lollipop";
import { useBaseCardContext } from "../card-base/hooks";
import { useKeyboardNavigationContext } from "../keyboard-navigation/hooks";

const extnPrefix = ExtnConfig.getInstance().get(ConfigKey.EXTN_PREFIX);

/**
 * Names of fired events.
 */
export const ToolboxEventNames = {
	turnOffLollipop: `${extnPrefix}-message.lollipop-turn-off`,
};

export type ToolboxTriggerType = LollipopTriggerType | "contextmenu" | "dblclick" | "toolbar" | "automatic";

export interface Props {
	type: "toolbox";
	environment: ToolboxEnvironment;
	uiLanguage: ToolboxUiLanguage;
	user: ToolboxUserContext;
	theme: ToolboxTheme;
	textContext: ToolboxTextContext;
	textfieldElement: HTMLElement;
	isIdle: boolean;
	hasDarkBackground: boolean;
	inhouseOnly: boolean;
	sentenceRanges: Array<[number, number]>;
	editorText: string;
	triggerType: ToolboxTriggerType;
	close: () => void;
	onApply: (event: ToolboxApplyEvent) => void;
	setTextHighlight: (type: ToolboxTextSelectionType, range: [number, number], isPreview?: boolean) => void;
	removeTextHighlight: () => void;
	onPluginSelect: (pluginId: string, skillId?: string) => void;
}

export function isToolboxContentProps(o: unknown): o is Props {
	return isObject(o) && "type" in o && o.type === "toolbox";
}

const LTCompToolboxContent = elementFactory("comp-toolbox-content");

const ToolboxContent: React.FC<Props> = ({
	triggerType: preliminaryTriggerType,
	environment,
	uiLanguage,
	user,
	theme,
	textContext,
	textfieldElement,
	hasDarkBackground,
	sentenceRanges,
	editorText,
	inhouseOnly,
	isIdle,
	close,
	onApply,
	setTextHighlight,
	onPluginSelect,
	removeTextHighlight,
}) => {
	const { isEnabled: isKeyboardNavigationEnabled } = useKeyboardNavigationContext();
	const { moveCardIntoViewport } = useBaseCardContext();
	const extnLollipopConfig = useMemo(() => ExtnConfig.getInstance().get(ConfigKey.LOLLIPOP_CONFIG), []);
	const toolboxIframeUrl = useMemo(
		() => EnvironmentAdapter.getURL(extnLollipopConfig.TOOLBOX_IFRAME_PATH),
		[extnLollipopConfig]
	);
	const toolboxContent = useRef<HTMLElement>(null);
	const [iframe, setIframe] = useState<ToolboxAdapterIframeHost | null>(null);
	const initialContext = useRef<ToolboxTextContext>(textContext);
	const isPreviouslySetIdle = useRef(false);

	const trackEvent = useCallback(
		(event: ToolboxMonitoringEvent) => TrackerAdapter.trackEvent("Lollipop", event.name, event.data),
		[]
	);

	useEffect(() => {
		if (!iframe || textContext === initialContext.current) {
			return;
		}
		iframe.updateTextContext(textContext);
	}, [textContext, iframe]);

	useEffect(() => {
		if (isIdle) {
			iframe?.setIdle(true);
			isPreviouslySetIdle.current = true;
		} else {
			if (isPreviouslySetIdle.current) {
				iframe?.setIdle(false);
				isPreviouslySetIdle.current = false;
			}
		}
	}, [iframe, isIdle]);

	useEffect(() => {
		// NOTE: In case the card is opened with a different mode and then switched to
		//       "toolbox", the trigger type isn't set. We have to rely on the boolean
		//       value `isKeyboardNavigationEnabled` then.
		const triggerType: ToolboxTriggerType = isKeyboardNavigationEnabled ? "keyboard" : preliminaryTriggerType;

		const { current: context } = initialContext;
		const colorScheme: ColorScheme = hasDarkBackground ? "dark" : "light";
		const options: ToolboxExternalRenderOptions = {
			setTextHighlight: (type: ToolboxTextSelectionType, range: [number, number], isPreview: boolean) =>
				setTextHighlight(type, range, isPreview),
			onMonitoringEvent: trackEvent,
			enableInitialFocus: triggerType === "keyboard",
			focusSearchField: triggerType !== "dblclick",
			colorScheme,
			onPluginSelect,
			context,
			theme,
			user,
			close,
			onApply,
			removeTextHighlight,
		};

		if (toolboxContent.current) {
			const detectedLanguages: DetectedSentenceLanguage[] = [];
			const sentenceRangeObjects: SentenceRange[] = sentenceRanges.map(([start, end]) => ({
				detectedLanguages: [...detectedLanguages],
				length: end - start,
				start,
				end,
			}));
			const iframeOptions: ToolboxHostContext = {
				uri: environment.uri,
				sentenceRanges: sentenceRangeObjects,
				triggerType,
				colorScheme,
				editorText,
				inhouseOnly,
			};
			if (context.locale) {
				iframeOptions.textLocale = context.locale;
			}

			const iframeHostConfig: ToolboxAdapterIframeHostInitConfig = {
				textfield: textfieldElement,
				mount: toolboxContent.current,
				url: toolboxIframeUrl,
				language: uiLanguage,
				iframeOptions,
				environment,
				options,
			};

			if (textfieldElement.ownerDocument !== toolboxContent.current.ownerDocument) {
				iframeHostConfig.eventTarget = textfieldElement.ownerDocument;
			}

			const instance = ToolboxAdapterIframeHost.init(iframeHostConfig);
			setIframe(instance);
			setTimeout(() => moveCardIntoViewport());

			return () => {
				instance.unmount();
			};
		}
	}, [
		user,
		environment,
		theme,
		close,
		onApply,
		trackEvent,
		setTextHighlight,
		removeTextHighlight,
		hasDarkBackground,
		textfieldElement,
		toolboxIframeUrl,
		sentenceRanges,
		inhouseOnly,
		editorText,
		uiLanguage,
		preliminaryTriggerType,
		isKeyboardNavigationEnabled,
		onPluginSelect,
		moveCardIntoViewport,
	]);

	return (
		<LTCompToolboxContent
			className={classes(isIdle && `${extnPrefix}-toolbox-content--is-idle`)}
			ref={toolboxContent}
		/>
	);
};

export default ToolboxContent;
