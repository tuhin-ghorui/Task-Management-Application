const FormField = ({ error, label, ...props }) => {
  const inputId = props.id || props.name;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold tracking-tight text-slate-700 dark:text-slate-300" htmlFor={inputId}>
        {label}
      </label>
      <input
        {...props}
        id={inputId}
        className="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 px-3.5 text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-emerald-500/10 outline-none shadow-sm"
      />
      {error ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default FormField;

