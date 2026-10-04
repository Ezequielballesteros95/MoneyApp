# Toda tu plata — onboarding

A mobile-first build of the Claude Design handoff in `../project/Money Onboarding.dc.html` and `Phone.dc.html`: the 12-screen money-tracker onboarding (Spanish, ARS), styled with the Nocturne design system (`src/styles/nocturne.css`, copied unchanged from `project/_ds/…/styles.css`).

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
npm run lint
```

Live at https://ezequielballesteros95.github.io/MoneyApp/. GitHub Actions builds and deploys it to GitHub Pages on every push to `main`. The build uses relative asset paths (`base: './'`), and the web manifest plus icons in `public/` let it be added to a phone's home screen as a standalone app.

## Structure

- `src/state.ts`: state shape, defaults, keypad editing and `localStorage` persistence
- `src/calc.ts`: everything computed from state (insights, verdict, tips), as pure functions
- `src/App.tsx`: the shell (top bar, progress, footer CTA, toast), navigation and keyboard handling
- `src/screens/`: one component per screen, grouped as Setup, Bills, Insights and Plan
- `src/components/ui.tsx`: Keypad, Stepper, Switch, Chip, Toast, ConfirmDialog

## Differences from the prototype

The phone frame becomes the real viewport. On a desktop the app is shown as a 390×844 card. The prototype-only screen list, the "all screens" overview and the `startStep` setting are gone. The insight screens still mix the design's sample data with what the user logs.

Changes made to keep it easy to use:

- **Saves as you go.** Everything is stored on the device. Reopening the app resumes on the same screen with the same data.
- **Back works everywhere.** Each screen is a browser-history entry, so the phone's back gesture and the in-app arrow both work.
- **Undo instead of loss.** Removing a monthly bill or logging a spend shows a toast with "Deshacer". "Borrar mis datos" (on the final screen) asks for confirmation first. "Volver a empezar" only goes back to the first screen and keeps your data.
- **Bigger touch targets.** Steppers, remove buttons, chips and switches are at least about 44px. In each bill card the amount moves to the second row so the name has room.
- **Easier amount entry.** Hold ⌫ on the keypad to clear the whole amount. On a computer you can type digits, use Backspace, Esc/Delete to clear, and Enter to continue. Bill amounts use the phone's numeric keyboard and show thousands separators. Picking "Otro" focuses its name field.
- **Smart return.** "Cargar ingresos" on "¿Me lo puedo dar?" takes you to Ingresos, and the button there becomes "Guardar y volver".
- **Real dates.** "Faltan N días" until payday uses today's date.
- **Accessibility.** Screen headings get focus on each step. Amounts, the verdict and toasts are announced (`aria-live`). Switches and progress use proper roles. Reduced-motion is respected.
- **Short phones.** On screens under 700px tall the keypad and footer get smaller so "¿Me lo puedo dar?" fits without scrolling.
