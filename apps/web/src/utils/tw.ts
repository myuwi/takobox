import React from "react";
import { cn } from "./cn";

// A very simplified implementation of react-twc / twin.macro

type Template<T extends React.ElementType> = (
  strings: TemplateStringsArray,
  ...values: any[]
) => React.FC<React.ComponentProps<T>>;

const createTemplate = <T extends React.ElementType>(tag: T): Template<T> => {
  return (strings: TemplateStringsArray, ...values: any[]) => {
    const classes = String.raw({ raw: strings }, ...values);

    const Component = ({ className, ...rest }: React.ComponentProps<T>) =>
      React.createElement(tag, {
        className: cn(classes, className),
        ...rest,
      });
    // @ts-expect-error
    Component.displayName = `tw.${tag.displayName ?? tag}`;

    return Component;
  };
};

type Tw = (<T extends React.ElementType>(component: T) => Template<T>) & {
  [Key in keyof React.JSX.IntrinsicElements]: Template<Key>;
};

export const tw = new Proxy(createTemplate, {
  get(_, name: keyof React.JSX.IntrinsicElements) {
    return createTemplate(name);
  },
}) as Tw;
