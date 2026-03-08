# Mobile Responsive Design

## Overview

The app now has a fully responsive design that adapts to mobile devices with a single-panel view.

## Desktop View (≥768px)

- **Two-panel layout**: Sidebar (320px) + Chat window
- Sidebar always visible on the left
- Chat window on the right
- Empty state shown when no chat selected

## Mobile View (<768px)

- **Single-panel layout**: Show one view at a time
- **Chat List View**: Full-screen list of chats
- **Chat View**: Full-screen chat with back button
- No empty state (goes straight to chat list)

## Implementation Details

### MainApp Component

**Desktop Behavior**:
```tsx
<Sidebar /> {/* Always visible */}
<ChatWindow /> {/* Or empty state */}
```

**Mobile Behavior**:
```tsx
{!selectedChatId && <Sidebar />} {/* Full screen */}
{selectedChatId && <ChatWindow />} {/* Full screen */}
```

### Responsive Classes Used

```tsx
// Sidebar container
className={`${selectedChatId ? 'hidden md:flex' : 'flex'} w-full md:w-80`}
// Hidden on mobile when chat selected
// Full width on mobile, 320px on desktop

// Empty state
className="hidden md:flex"
// Only shown on desktop

// Back button in ChatHeader
className="md:hidden"
// Only shown on mobile
```

### Navigation Flow

**Mobile**:
1. User sees chat list (full screen)
2. Taps a chat → Chat opens (full screen)
3. Taps back button ← Returns to chat list

**Desktop**:
1. User sees sidebar + empty state
2. Clicks a chat → Chat opens in right panel
3. Sidebar remains visible

## Components Modified

### 1. MainApp.tsx
- Added `handleBackToList()` function
- Conditional rendering based on screen size
- Pass `onBack` prop to ChatWindow

### 2. ChatWindow.tsx
- Added optional `onBack` prop
- Pass `onBack` to ChatHeader

### 3. ChatHeader.tsx
- Added optional `onBack` prop
- Added back button with ArrowLeft icon
- Back button only visible on mobile (`md:hidden`)
- Reduced horizontal padding on mobile (`px-4 md:px-6`)

### 4. Sidebar.tsx
- Changed from fixed width to responsive width
- `w-80` → `w-full` (mobile) / `w-80` (desktop)

## Breakpoints

Using Tailwind's default breakpoints:
- **Mobile**: < 768px
- **Desktop**: ≥ 768px (md: prefix)

## Testing Checklist

### Mobile (< 768px)
- [x] Chat list shows full screen
- [x] Selecting chat opens full screen
- [x] Back button appears in chat header
- [x] Back button returns to chat list
- [x] No sidebar visible in chat view
- [x] No empty state shown

### Desktop (≥ 768px)
- [x] Sidebar always visible (320px)
- [x] Chat window shows on right
- [x] Empty state when no chat selected
- [x] Back button hidden
- [x] Both panels visible simultaneously

### Transitions
- [x] Smooth switching between views
- [x] No layout shift or flicker
- [x] Proper scroll behavior maintained

## Additional Mobile Optimizations

### Touch Targets
- Buttons have adequate size (min 44x44px)
- Proper spacing between interactive elements

### Typography
- Font sizes remain readable on small screens
- Line heights optimized for mobile

### Spacing
- Reduced padding on mobile where appropriate
- Maintained comfortable tap targets

### Performance
- No unnecessary re-renders
- Efficient conditional rendering

## Future Mobile Enhancements

1. **Swipe Gestures**
   - Swipe right to go back from chat
   - Swipe left on chat item for quick actions

2. **Pull to Refresh**
   - Pull down on chat list to refresh

3. **Bottom Navigation**
   - Alternative navigation pattern for mobile

4. **Haptic Feedback**
   - Vibration on button taps (iOS/Android)

5. **Safe Area Insets**
   - Respect notch/home indicator on modern phones

6. **Landscape Mode**
   - Optimize layout for landscape orientation

7. **Tablet View**
   - Hybrid layout for tablets (iPad, etc.)

## Browser Compatibility

Tested on:
- iOS Safari (iPhone)
- Chrome Mobile (Android)
- Firefox Mobile
- Samsung Internet

## Accessibility

- Back button has proper ARIA labels
- Touch targets meet WCAG guidelines
- Keyboard navigation still works
- Screen reader compatible

## Known Issues

None currently.

## Related Files

- `src/components/MainApp.tsx`
- `src/components/chat/ChatWindow.tsx`
- `src/components/chat/ChatHeader.tsx`
- `src/components/chat/Sidebar.tsx`
