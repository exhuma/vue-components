Vue Components
==============

A collection of reusable Vue 3 components for use across multiple projects.

## Components

### ResourceAutocomplete

A generic autocomplete component for searching and selecting resources from a repository.

**Props:**
- `label` (string, required) - Label for the autocomplete field
- `modelValue` (string) - Selected item ID (v-model)
- `repository` (Repository<T>, required) - Repository instance with get/getInitialSet/query methods
- `itemTitle` (string, default: "name") - Property to display as title
- `itemValue` (string, default: "id") - Property to use as value
- `density` (string, default: "compact") - Vuetify density
- `hideDetails` (boolean | "auto", default: "auto") - Hide validation details
- `variant` (string, default: "outlined") - Vuetify variant

**Events:**
- `update:modelValue` - Emitted when selection changes
- `item-selected` - Emitted when an item is selected (includes full item)

**Usage:**
```vue
<ResourceAutocomplete
  v-model="selectedId"
  label="Select Item"
  :repository="myRepository"
  @item-selected="handleSelection"
/>
```

### ConfirmedButton

A button that requires confirmation before executing an action.

### MapView

A map component for displaying locations.

### ResourceDataTable

A data table component with server-side pagination and sorting.

## Types

The `types/` directory contains TypeScript type definitions used across components.
