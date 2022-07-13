import { parseStyle } from "./piw-utils-internal";
import { RichTextPreviewProps } from "../typings/RichTextProps";

declare function require(name: string): string;

export function preview(props: RichTextPreviewProps) {
    return <div style={parseStyle(props.style)}></div>;
}

export function getPreviewCss(): string {
    return require("./ui/index.scss");
}
