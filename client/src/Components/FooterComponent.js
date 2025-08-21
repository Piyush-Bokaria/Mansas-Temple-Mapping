import React from 'react';

const footer = () => {
    const year = new Date().getFullYear();
    return (<div id="footer">
        &copy; MANSAS {year} | All Rights Reserved | Version 1.
    </div>)
}

export default footer;