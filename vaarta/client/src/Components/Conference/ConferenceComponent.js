import styled from 'styled-components';
import image from '../../images/codebugged.png';

export const Container = styled.div`
    display: grid;
    width: 100%;
    min-height: 100vh;
    grid-template-columns: 8fr 2fr;
    background-color: #2C3E50;
`

export const Holder = styled.div`
    display: grid;
    grid-template-rows: 8.5fr 1.5fr;
    grid-gap: 15px;
    height: 100%;
    width: 100%;
    overflow: auto;
`

export const Utils = styled.div`
    height: 100%;
    background-color: #3E5771;
    border-top-right-radius: 17px;
    border-bottom-right-radius: 17px;
`

export const ContainerVideo = styled.div`
    padding: 10px;
`

export const VideoContainer = styled.div`
    display: grid;
    place-items: center;
    grid-gap: 10px;
    width: 100%;
    height: 100%;
`

export const VideoHolder = styled.div`
    display: grid;
    place-items: center;
`

export const ActionHolder = styled.div`
    width: 100%;
    display: grid;
    place-items: center;
    height: 100%;
`

export const Actions = styled.div`
    background-color: #3E5771;
    width: 50%;
    height: 10vh;
    border-radius: 15px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
`

export const OwnVideo = styled.video`
    border-radius: 15px;
    overflow: hidden;
    transform: scaleX(-1);
    width: 100%;
    height: 100%;
`