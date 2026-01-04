const Toast = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-text-primary text-bg-primary px-6 py-3 rounded-md font-bold shadow-lg">
        {message}
      </div>
    </div>
  );
};

export default Toast;
