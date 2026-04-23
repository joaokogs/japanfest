"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = (props: ToasterProps) => (
	<Sonner
		position="bottom-right"
		richColors
		{...props}
	/>
);

export { Toaster };
