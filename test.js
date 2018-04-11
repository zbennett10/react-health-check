import React from 'react';
import {configure} from 'enzyme';
import {shallow} from 'enzyme';
import {default as Adapter} from 'enzyme-adapter-react-16';
import HealthCheck from './src/index';

configure({adapter: new Adapter()});


test("Health Check renders an overall status view.", () => {
    const component = shallow(
        <HealthCheck endpoints={[]} interval={5000}/>
    );
    expect(component.find(".rhc-overall-status-view").length).toBe(1);
});

test("Health Check doesn't render a detailed status view unless clicked.", () => {
    const component = shallow(
        <HealthCheck endpoints={[]} interval={5000}/>
    );

    expect(component.find(".rhc-detailed-status-view").length).toBe(0);

    component.find(".rhc-overall-status-view").simulate("click");

    expect(component.find(".rhc-detailed-status-view").length).toBe(1);
});