import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import JoinScreen from '../Components/EntryComponent';
import CreateScreen from '../Components/CreateComponent';
import Conference from '../Components/Conference';
import PrivateRoute from '../Components/PrivateRoute';

function Main(){

    return(
        <Switch>
            <Route exact path="/" component={(props) => <CreateScreen {...props} />} />
            <Route exact path="/join/:meetId" component={(props) => <JoinScreen {...props} /> } />
            <PrivateRoute exact path="/meet/:meetId" component={(props) => <Conference {...props} />} />
            <Redirect to="/" />
        </Switch>
    )
}

export default Main;