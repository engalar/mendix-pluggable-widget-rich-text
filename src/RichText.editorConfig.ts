import { Properties, StructurePreviewProps, transformGroupsIntoTabs } from "./piw-utils-internal";
import { RichTextPreviewProps } from "../typings/RichTextProps";

export function getProperties(
    values: RichTextPreviewProps,
    defaultProperties: Properties,
    platform: "web" | "desktop"
): Properties {
    console.log(values);
    if (platform === "web") {
        transformGroupsIntoTabs(defaultProperties);
    }
    return defaultProperties;
}
export function getPreview(values: RichTextPreviewProps): StructurePreviewProps | null {
    console.log(values);
    return null;
}
