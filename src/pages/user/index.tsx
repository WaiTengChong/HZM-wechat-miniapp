import { Text, View } from '@tarojs/components';
import { Component } from 'react';
import { AtButton } from 'taro-ui';

export default class User extends Component {
  render () {
    return (
        <View className='user-page'>
          <Text>我的</Text>
          <AtButton type='primary'>This is the User Page</AtButton>
        </View>
      );
  }
} 