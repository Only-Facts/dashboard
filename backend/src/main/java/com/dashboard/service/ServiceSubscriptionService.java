package com.dashboard.service;

import com.dashboard.common.exception.ApiErrors;
import com.dashboard.dashboard.Catalog;
import com.dashboard.dashboard.persistence.ServiceConnectionRepository;
import com.dashboard.dashboard.persistence.WidgetRepository;
import com.dashboard.user.UserLockRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ServiceSubscriptionService {

  private final Catalog catalog;
  private final WidgetRepository widgets;
  private final ServiceConnectionRepository connections;
  private final UserLockRepository userLock;

  public ServiceSubscriptionService(
      Catalog catalog,
      WidgetRepository widgets,
      ServiceConnectionRepository connections,
      UserLockRepository userLock) {
    this.catalog = catalog;
    this.widgets = widgets;
    this.connections = connections;
    this.userLock = userLock;
  }

  public boolean connected(long userId, String serviceName) {
    Catalog.Service service = catalog.service(serviceName);
    Optional<Boolean> enabled = connections.enabled(userId, serviceName);
    return enabled.orElse(!service.oauth());
  }

  @Transactional
  public void connect(long userId, String serviceName, String encryptedToken) {
    userLock.lock(userId);
    catalog.service(serviceName);
    connections.connect(userId, serviceName, encryptedToken);
  }

  @Transactional
  public void disconnect(long userId, String serviceName) {
    userLock.lock(userId);
    catalog.service(serviceName);
    widgets.deleteByService(userId, serviceName);
    connections.disconnect(userId, serviceName);
  }

  public String githubToken(long userId) {
    return connections.githubToken(userId)
        .orElseThrow(() -> ApiErrors.badRequest("Reconnect GitHub to continue"));
  }
}
