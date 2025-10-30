## @aimey/feedback-widget

React feedback widget with screenshot and annotation.

### Installation

```bash
yarn add @aimey/feedback-widget
# or
npm i @aimey/feedback-widget
```

### Styling requirement (Tailwind CSS)

This package uses Tailwind utility classes in its markup. You must provide
Tailwind CSS in your app via one of the following:

- Local Tailwind setup (recommended): Have Tailwind configured in your app
  (PostCSS + tailwind.config.js). No extra steps required.
- CDN (quick start / prototypes): Add the CDN script in your HTML.

CDN example (Vite index.html):

```html
<head>
  <!-- other tags -->
  <script src="https://cdn.tailwindcss.com"></script>
</head>
```

> Note: `tailwindcss` is listed as a peerDependency. If you use the CDN,
> you can ignore the peer warning.

### Usage

```tsx
import { FeedbackWidget } from "@aimey/feedback-widget";

export default function App() {
  return (
    <FeedbackWidget
      onSubmit={async ({ email, description, screenshots }) => {
        // send to your API
        return { success: true };
      }}
      labels={{ title: "Feedback" }}
    />
  );
}
```

### Peer dependencies

- react >= 18
- react-dom >= 18
- tailwindcss >= 3 (or Tailwind via CDN)

### License

MIT
