import { Outlet } from 'react-router-dom';
import { Header, Footer } from '@joisse1101/ui-library';
export function MainLayout() {

    return (
        <div className="layout">
            <Header links={[
                { label: 'The Log', href: '/the-log/' },
                { label: 'The Board', href: '/the-log/the-board' },
            ]} >
            </Header>
            <main>
                <Outlet /> {/* Child routes render here */}
            </main>

            <Footer />
        </div>
    );
}