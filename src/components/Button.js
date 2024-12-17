const Button = ({onClick,label,className = ""}) => {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 ${className}`}
        >
            {label}
        </button>
    );
};

export default Button;
