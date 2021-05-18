import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { isNamed } from '../../helpers/auth.helpers'; 

function PrivateRoute(props){

    return(
        isNamed() ? 
            <Route exact={props.exact} path={props.path} component={props.component} /> : 
            <Redirect to="/" />
    )
}

export default PrivateRoute;