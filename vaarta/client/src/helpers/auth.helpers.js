export const setSessionStorage = (key, value) => {
    if(sessionStorage.getItem(key)){
        sessionStorage.removeItem(key);
    }
    sessionStorage.setItem(key, value);
}

export const isNamed = () => {
    if(sessionStorage.getItem('userName')){
        return true
    } else {
        return false
    }
}