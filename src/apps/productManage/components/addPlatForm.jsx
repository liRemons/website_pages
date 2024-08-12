import React from 'react';
import AddFieldForm from './addFieldForm';
import { plantFormKey } from '../model/const';

export default class AddPlantForm extends React.Component {
    render () {
        return <AddFieldForm {...this.props} label="平台/店铺" localStorageKey={plantFormKey} />
    }
}