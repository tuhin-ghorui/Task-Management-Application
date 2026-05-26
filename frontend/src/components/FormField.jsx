const FormField = ({ error, label, ...props }) => {
  const inputId = props.id || props.name;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700" htmlFor={inputId}>
        {label}
      </label>
      <input
        {...props}
        id={inputId}
        className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
      {error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default FormField;
