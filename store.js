import { createStore, applyMiddleware, compose } from 'redux';
import withRedux from 'next-redux-wrapper';
import thunkMiddleware from 'redux-thunk';
import reducers from 'reducers';
import createSagaMiddleware from 'redux-saga';
import rootSaga from 'sagas';
import withReduxSaga from 'hocs/lib/withReduxSaga.js';

export const sagaMiddleware = createSagaMiddleware();

const composeEnhancers = (typeof window != 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;

export const initStore = (initialState = {}) => {
  const store = createStore(reducers, initialState, composeEnhancers(applyMiddleware(thunkMiddleware), applyMiddleware(sagaMiddleware)));

  store.sagaTask = sagaMiddleware.run(rootSaga);

  return store;
};

export const connect = (mapStateToProps, actions = {}) => {
  return component => withRedux(initStore, mapStateToProps, actions)(withReduxSaga(component));
};
