
import React from 'react';
import NotificationBell from './NotificationBell';
import { UseNotificationsReturn } from '../hooks/useNotifications';

interface HeaderProps {
    title: string;
    notificationsHook: UseNotificationsReturn;
}

const Header: React.FC<HeaderProps> = ({ title, notificationsHook }) => {
    return (
        <div className="flex-shrink-0 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            <NotificationBell {...notificationsHook} />
        </div>
    );
};

export default Header;
