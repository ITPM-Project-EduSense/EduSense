# EduSense Design System

## Color Palette
- **Primary**: Indigo-600 (`bg-indigo-600`, `text-indigo-600`)
- **Primary Light**: Indigo-50 (`bg-indigo-50`)
- **Text Dark**: Slate-900 (`text-slate-900`)
- **Text Light**: Slate-600 (`text-slate-600`)
- **Text Extra Light**: Slate-500 (`text-slate-500`)
- **Borders**: Slate-200/60 (`border-slate-200/60`)

## Background
- **Page Background**: `bg-gradient-to-br from-slate-50 via-white to-indigo-50/30`
- **Card Background**: `bg-white/90 backdrop-blur-md`

## Components

### Card (Global)
```jsx
<div className="rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md shadow-sm hover:shadow-md transition-shadow">
  {/* Card content */}
</div>
```

### Card Header
```jsx
<div className="border-b border-slate-200/60 px-6 py-4 bg-gradient-to-r from-indigo-50/50 to-transparent">
  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Section Title</h2>
</div>
```

### Button (Primary)
```jsx
<button className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-sm hover:shadow-md">
  Action
</button>
```

### Button (Secondary)
```jsx
<button className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 transition-all hover:bg-slate-50">
  Cancel
</button>
```

### Input Field
```jsx
<input
  type="text"
  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
/>
```

### Section Title
```jsx
<h1 className="text-4xl font-bold text-slate-900">Page Title</h1>
<p className="mt-2 text-sm text-slate-600">Subtitle/description</p>
```

### Metric Card (3-column)
```jsx
<div className="grid gap-6 lg:grid-cols-3">
  <div className="rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md p-6 shadow-sm hover:shadow-md transition-shadow">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Label</p>
    <p className="mt-4 text-3xl font-bold text-slate-900">Value</p>
    <p className="mt-2 text-xs text-slate-500">Description</p>
  </div>
</div>
```

## Typography
- **Page Title**: `text-4xl font-bold text-slate-900`
- **Section Title**: `text-sm font-semibold uppercase tracking-wide text-slate-900`
- **Subtitle**: `text-sm text-slate-600`
- **Body**: `text-sm text-slate-700`
- **Small Text**: `text-xs text-slate-500`
- **Label**: `text-xs font-semibold uppercase tracking-wide text-slate-600`

## Spacing
- Page padding: `px-4 py-8 md:px-8`
- Card padding: `p-6`
- Header padding: `px-6 py-4`
- Section gap: `gap-8` or `gap-6`
- Line gap: `space-y-6` or `space-y-4`

## Rounded Corners
- Cards & Buttons: `rounded-xl` or `rounded-lg`
- Inputs: `rounded-lg`

## Shadows
- Cards at rest: `shadow-sm`
- Cards on hover: `hover:shadow-md transition-shadow`

## Page Layout Template
```jsx
export default function PageName() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Page Title</h1>
          <p className="mt-2 text-sm text-slate-600">Description</p>
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Card */}
          <div className="rounded-xl border border-slate-200/60 bg-white/90 backdrop-blur-md shadow-sm overflow-hidden">
            <div className="border-b border-slate-200/60 px-6 py-4 bg-gradient-to-r from-indigo-50/50 to-transparent">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Section</h2>
            </div>
            <div className="p-6">
              {/* Card content */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Apply-To Pages
- ✅ Dashboard
- ✅ Profile
- Tasks Page
- Planner Page
- AI Insights Page
- Study Groups Page
- Analytics Page
