import "./Dissolve.css";

export default function Dissolve({ active }) {
  return (
    <div
      className={`dissolve ${active ? "dissolve--in" : "dissolve--out"}`}
      aria-hidden="true"
    />
  );
}
