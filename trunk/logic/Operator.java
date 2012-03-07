package logic;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * An Operator has a truth value that is conditioned on the truth
 * values of its arguments.
 *
 * @author Pablo Mayrgundter
 */
public abstract class Operator
  extends ArrayList<Proposition>
  implements Proposition, List<Proposition> {

  /**
   * Equivalent to Operator(2);
   */
  public Operator() {
    super(2);
  }

  public Operator(Collection<? extends Proposition> c) {
    super(c);
  }

  public Operator(int initialCapacity) {
    super(initialCapacity);
  }

  public boolean isBound() {
    for (Proposition p : this)
      if (!p.isBound())
        return false;
    return true;
  }

  public String toString() {
    final StringBuffer buf = new StringBuffer();
    String opStr = " "+ getClass().getSimpleName().toUpperCase() +" ";
    for (int i = 0; i < size(); i++) {
      if (i > 0)
        buf.append(opStr);
      buf.append(get(i));
    }
    return buf.toString();
  }
}
    