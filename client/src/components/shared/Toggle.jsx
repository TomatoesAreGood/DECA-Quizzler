import * as Switch from '@radix-ui/react-switch';

export function Toggle({ label, checked, onChange }) {
  return (
    <li>
      <p id="switch-text">{label}</p>
      <Switch.Root
        className="switch"
        checked={checked}
        onCheckedChange={onChange}
      >
        <Switch.Thumb className="slider round" />
      </Switch.Root>
    </li>
  );
}
