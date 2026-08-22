import React from 'react';
 
// Collapses the repeated "label + input + conditional error border + error message"
// block into one line per field wherever it's used.
const FormField = ({
  label,
  value,
  onChange,
  error,
  type = "text",
  as = "input",
  className = "",
  ...rest
}) => {
  const fieldClasses = `w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
    error ? "border-red-400" : "border-slate-300"
  }`;
 
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {as === "textarea" ? (
        <textarea value={value} onChange={onChange} className={fieldClasses} {...rest} />
      ) : (
        <input type={type} value={value} onChange={onChange} className={fieldClasses} {...rest} />
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error[0]}</p>}
    </div>
  );
};
 
export default FormField;
