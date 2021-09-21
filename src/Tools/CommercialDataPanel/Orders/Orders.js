import React, { useEffect, useLayoutEffect, useState } from 'react';
import moment from 'moment';
import { connect } from 'react-redux';
import { t } from 'ttag';
import { OrderStatus, TPDI, TPDProvider } from '@sentinel-hub/sentinelhub-js';
import {
  extractErrorMessage,
  fetchOrders,
  fetchUserBYOCLayers,
  getBestMatchingLayer,
  getBoundsAndLatLng,
  formatNumberAsRoundedUnit,
  showDataOnMap,
} from '../commercialData.utils';
import store, { commercialDataSlice, mainMapSlice } from '../../../store';
import { EOBButton } from '../../../junk/EOBCommon/EOBButton/EOBButton';
import { NotificationPanel } from '../../../Notification/NotificationPanel';
import ExternalLink from '../../../ExternalLink/ExternalLink';

import './Orders.scss';

const orderStatus = [
  {
    status: OrderStatus.CREATED,
    title: () => t`Created orders (Not confirmed)`,
  },
  {
    status: OrderStatus.RUNNING,
    title: () => t`Running orders`,
  },
  {
    status: OrderStatus.DONE,
    title: () => t`Finished orders`,
  },
];

const OrderProperties = {
  created: {
    label: () => t`Created at`,
    format: (value) => moment.utc(value).format('YYYY-MM-DD HH:mm:ss'),
  },
  confirmed: {
    label: () => t`Confirmed at`,
    format: (value) => moment.utc(value).format('YYYY-MM-DD HH:mm:ss'),
  },
  provider: {
    label: () => t`Provider`,
  },
  sqkm: {
    label: () => t`Size`,
    format: (value) => formatNumberAsRoundedUnit(value, 2, 'km²'),
  },
  status: {
    label: () => t`Status`,
  },
  input: {
    label: () => t`All input parameters`,
  },
  id: {
    label: () => t`Order ID`,
  },
  collectionId: {
    label: () => t`Collection ID`,
  },
};

const JSONProperty = (order, property) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const value = order[property];

  if (!value) {
    return null;
  }

  return (
    <>
      <div key={OrderProperties[property].label} className="order-property">
        <div>
          {OrderProperties[property] && OrderProperties[property].label()
            ? OrderProperties[property].label()
            : property}
          :
        </div>
        <div>
          <i
            className={`fa fa-eye${isExpanded ? '-slash' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
            title={`${isExpanded ? t`Hide ${property} values` : t`Show ${property} values`}`}
          ></i>
        </div>
      </div>

      {isExpanded && (
        <div className="order-property-json">
          <pre>{JSON.stringify(value, null, 2)}</pre>
        </div>
      )}
    </>
  );
};

const OrderDetails = ({ order, setAction, layer }) => {
  const orderButtons = [
    {
      title: () => t`Confirm`,
      onClick: () => setAction('confirmOrder', order),
      status: [OrderStatus.CREATED],
      icon: 'check',
      hidden: false,
    },
    {
      title: () => t`Delete`,
      onClick: () => setAction('deleteOrder', order),
      status: [OrderStatus.CREATED, OrderStatus.DONE],
      icon: 'trash',
      hidden: false,
    },
    {
      title: () => t`Show coverage`,
      onClick: () => {
        if (order && order.input && order.input.bounds && order.input.bounds.geometry) {
          store.dispatch(commercialDataSlice.actions.setSelectedOrder(order));
          const { lat, lng, zoom } = getBoundsAndLatLng(order.input.bounds.geometry);
          store.dispatch(mainMapSlice.actions.setPosition({ lat: lat, lng: lng, zoom: zoom }));
        }
      },
      status: [OrderStatus.CREATED, OrderStatus.DONE, OrderStatus.RUNNING],
      icon: 'crosshairs',
      hidden: false,
    },
    {
      title: () => t`Show data`,
      onClick: async () => {
        await showDataOnMap(order, layer);
      },
      status: [OrderStatus.DONE],
      icon: 'map',
      hidden: !layer,
    },
  ];

  return (
    <div className="order-details">
      <div className="order-properties">
        {Object.keys(order)
          .filter((property) => !['name', 'userId', 'geometry', 'input'].includes(property))
          .map((property) => (
            <div key={property} className="order-property">
              <div>
                {OrderProperties[property] && OrderProperties[property].label()
                  ? OrderProperties[property].label()
                  : property}
                :
              </div>
              <div>
                {OrderProperties[property] && OrderProperties[property].format
                  ? OrderProperties[property].format(order[property])
                  : order[property]}
              </div>
            </div>
          ))}
        {}
      </div>
      {JSONProperty(order, 'input')}

      {order.provider === TPDProvider.PLANET && (
        <NotificationPanel>
          {t`Note that it is technically possible to order more PlanetScope data than your purchased quota. Make sure your order is in line with the Hectares under Management (HUM) model to avoid overage fees.` +
            ` `}
          <ExternalLink href="https://www.sentinel-hub.com/faq/#how-the-planetscope-hectares-under-management-works">
            {t`More information`}
          </ExternalLink>
        </NotificationPanel>
      )}

      <div className="buttons">
        {orderButtons
          .filter((button) => button.status.includes(order.status) && !button.hidden)
          .map((button, index) => (
            <EOBButton
              key={`${order.id}-${index}`}
              onClick={() => button.onClick(order)}
              text={button.title()}
              title={button.title()}
              icon={button.icon}
            />
          ))}
      </div>
    </div>
  );
};

const Order = ({ activeOrderId, order, setAction, setActiveOrderId, refs, layer }) => {
  const [showDetails, setShowDetails] = useState(order.id === activeOrderId);

  useLayoutEffect(() => {
    if (activeOrderId && activeOrderId === order.id)
      refs[order.id].current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
  }, [activeOrderId, order, refs]);

  return (
    <div className="order" ref={refs[order.id]}>
      <div
        className="order-header"
        onClick={() => {
          if (showDetails && activeOrderId === order.id) {
            setActiveOrderId(null);
          }
          setShowDetails(!showDetails);
        }}
      >
        <div className="order-title">
          <div>{order.name}</div>
          <div>{moment.utc(order.created).format('YYYY-MM-DD')}</div>
        </div>
        <div className="toggle-details">
          <i className={`fa fa-chevron-${showDetails ? 'up' : 'down'}`} />
        </div>
      </div>
      {!!showDetails && <OrderDetails order={order} setAction={setAction} layer={layer} />}
    </div>
  );
};

const OrdersByStatus = ({
  activeOrderId,
  orders,
  status,
  setAction,
  setActiveOrderId,
  title,
  userByocLayers,
}) => {
  const filteredOrders = orders
    .filter((order) => order.status === status)
    .sort((a, b) => moment.utc(b.created).diff(moment.utc(a.created)));

  const refs = filteredOrders.reduce((acc, order) => {
    acc[order.id] = React.createRef();
    return acc;
  }, {});

  return (
    <div className="orders-list">
      <div className="order-status">{title}</div>
      {filteredOrders.length ? (
        <div className="orders">
          {filteredOrders.map((order) => (
            <Order
              key={order.id}
              refs={refs}
              order={order}
              status={status}
              setAction={setAction}
              setActiveOrderId={setActiveOrderId}
              activeOrderId={activeOrderId}
              layer={getBestMatchingLayer(userByocLayers, order.collectionId, 'TRUE')}
            />
          ))}
        </div>
      ) : (
        <NotificationPanel msg={t`No orders found`} type="info" />
      )}
    </div>
  );
};

export const Orders = ({ activeOrderId, setActiveOrderId, setConfirmAction, user, themesLists }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [userByocLayers, setUserByocLayers] = useState([]);

  const fetchData = async (user, themesLists) => {
    try {
      setIsLoading(true);
      setError(null);
      const allOrders = await fetchOrders(user);
      const byocLayers = await fetchUserBYOCLayers(
        user,
        themesLists && themesLists.user_instances ? themesLists.user_instances : [],
      );
      setOrders(allOrders);
      setUserByocLayers(byocLayers);
    } catch (err) {
      console.error(err);
      setError(extractErrorMessage(err));
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(user, themesLists);
  }, [user, themesLists]);

  const confirmOrderAction = async (order) => {
    try {
      const requestsConfig = {
        authToken: user.access_token,
      };
      const confirmedOrder = await TPDI.confirmOrder(order.id, requestsConfig);
      setActiveOrderId(order.id);
      setOrders([...orders.filter((o) => o.id !== order.id), { ...confirmedOrder }]);
      setConfirmAction(null);
    } catch (err) {
      console.error(err);
      setConfirmAction({
        title: () => t`Error confirming order`,
        message: extractErrorMessage(err),
        action: () => setConfirmAction(null),
        showCancel: false,
      });
    }
  };

  const deleteOrderAction = async (order) => {
    try {
      const requestsConfig = {
        authToken: user.access_token,
      };
      await TPDI.deleteOrder(order.id, requestsConfig);
      setOrders(orders.filter((o) => o.id !== order.id));
      if (!!activeOrderId) {
        setActiveOrderId(null);
      }
      setConfirmAction(null);
    } catch (err) {
      console.error(err);
      setConfirmAction({
        title: () => t`Error deleting order`,
        message: extractErrorMessage(err),
        action: () => setConfirmAction(null),
        showCancel: false,
      });
    }
  };

  const setAction = (action, order) => {
    switch (action) {
      case 'confirmOrder':
        setConfirmAction({
          title: () => t`Confirm order`,
          message: t`Are you sure you want to confirm this order?`,
          action: () => confirmOrderAction(order),
          showCancel: true,
        });
        break;
      case 'deleteOrder':
        setConfirmAction({
          title: () => t`Delete order`,
          message: t`Are you sure you want to delete this order?`,
          action: () => deleteOrderAction(order),
          showCancel: true,
        });
        break;

      default:
    }
  };

  return (
    <div className="commercial-data-orders">
      {isLoading ? (
        <div className="loader">
          <i className="fa fa-spinner fa-spin fa-fw" />
        </div>
      ) : (
        orderStatus.map((item) => (
          <OrdersByStatus
            key={item.status}
            orders={orders}
            status={item.status}
            title={item.title()}
            setAction={setAction}
            activeOrderId={activeOrderId}
            setActiveOrderId={setActiveOrderId}
            userByocLayers={userByocLayers}
          />
        ))
      )}
      <div className="actions-container">
        <EOBButton
          className="commercial-data-button"
          fluid
          disabled={isLoading}
          onClick={() => fetchData(user, themesLists)}
          text={t`Refresh orders`}
        />
      </div>
      {!!error && <NotificationPanel type="error" msg={error} />}
    </div>
  );
};

const mapStoreToProps = (store) => ({
  user: store.auth.user,
  themesLists: store.themes.themesLists,
  selectedLanguage: store.language.selectedLanguage,
});

export default connect(mapStoreToProps, null)(Orders);
