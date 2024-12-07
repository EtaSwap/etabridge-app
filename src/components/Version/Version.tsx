import React, {useEffect, useState} from 'react'
import pkg from '../../../package.json';
import './Version.css'
import {API} from "../../config";
import axios from "axios";
import {Popover} from "antd";
// @ts-ignore
import LayerZeroLogo from '../../assets/img/layerzero.svg';

function Version() {
    const [statusOk, setStatusOk] = useState<boolean>(false);
    const healthcheck = async () => {
        const req = `${API}/healthcheck`;
        const res = await axios.get(req);
        setStatusOk(res?.data.status === 'ok')
    }

    useEffect(() => {
        healthcheck();
        setInterval(() => healthcheck(), 20000);
    }, []);

    return (
        <>
            <div className="builton">
                Built on <a className='builton__link' title='Layer Zero' target='_blank' href="https://layerzero.network/" rel="noreferrer"><img className='builton__logo' src={LayerZeroLogo} alt="Built on Layer Zero"/></a>
            </div>
            <div className="version__wrapper">
                <Popover
                    trigger='hover'
                    placement='topLeft'
                    content={ statusOk ? 'All systems operational' : 'Backend is offline' }
                    className='version__healthcheck'
                >{ statusOk ? '🟢' : '🔴' }</Popover>&nbsp;
                <div className="version">v{pkg.version}</div>
            </div>
        </>
    )
}

export default Version;
