export function Textarea({ value, onChange, rows = 4, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      rows={rows}
      placeholder={placeholder}
      className="w-full p-2 border rounded"
    />
  );
}
