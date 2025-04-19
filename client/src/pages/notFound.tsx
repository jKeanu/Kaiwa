const NotFound = () => {
    return (
        <div className="not-found-container">
            404 Not Found
            <span>
                Go back to &nbsp;
                <a href="/login" aria-label="Return to login page">
                    Login page
                </a>
            </span>
        </div>
    );
};

export default NotFound;
