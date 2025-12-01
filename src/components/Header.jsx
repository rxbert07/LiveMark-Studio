import { ThemeToggle } from "./ThemeToggle";

export function Header({ theme, toggleTheme }) {
    return (
        <header className={`w-full h-14 px-4 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
            }`}>
            <h1 className="text-lg font-semibold">LiveMark Studio</h1>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </header>
    );
}
