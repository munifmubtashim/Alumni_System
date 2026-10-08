A three-way switch — Light, Dark, System — in a `radius-pill` track. The selected option sits on `surface-raised` inside the `surface-sunken` track, so the current choice reads as a raised segment rather than a color change.

"System" follows `prefers-color-scheme` and updates live if the OS setting changes while it's selected. Implement by toggling `data-theme` on the document root between `light` and `dark`; every token in this system already has a value for both, so nothing else needs to change.
